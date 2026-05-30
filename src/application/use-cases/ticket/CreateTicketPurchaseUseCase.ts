import { ITicketRepository, ITicketCategoryRepository, IEventRepository } from '../../domain/repositories';
import { IPaymentProvider } from '../ports';
import { Ticket } from '../../domain/entities/Ticket';
import { DomainEvents } from '../../domain/events/DomainEvents';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);

export interface CreateTicketPurchaseInput {
  eventId: string;
  categoryId: string;
  buyerFullname: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerProfession?: string;
  callbackUrl: string;
}

export interface CreateTicketPurchaseOutput {
  ticketId: string;
  paymentUrl?: string;
  providerReference: string;
  token: string;
  isFree: boolean;
}

export class CreateTicketPurchaseUseCase {
  constructor(
    private readonly ticketRepo: ITicketRepository,
    private readonly categoryRepo: ITicketCategoryRepository,
    private readonly eventRepo: IEventRepository,
    private readonly paymentProvider: IPaymentProvider,
  ) {}

  async execute(input: CreateTicketPurchaseInput): Promise<CreateTicketPurchaseOutput> {
    // 1. Vérifier que l'événement existe et accepte des tickets
    const event = await this.eventRepo.findById(input.eventId);
    if (!event) throw new Error('Event not found');
    if (!event.canAcceptTickets()) {
      throw new Error(`Event is not accepting tickets (status: ${event.status})`);
    }

    // 2. Vérifier la catégorie et la disponibilité
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) throw new Error('Ticket category not found');
    if (category.eventId !== input.eventId) throw new Error('Category does not belong to this event');
    if (!category.isAvailable()) throw new Error(`Category "${category.name}" is not available or sold out`);

    // 3. Générer le token unique
    const year = new Date().getFullYear().toString().slice(-2);
    const token = `EVT${year}_${nanoid()}`;
    const ticketId = uuidv4();

    // 4. Créer le ticket en statut PENDING
    const now = new Date();
    const ticket = Ticket.create({
      eventId: input.eventId,
      categoryId: input.categoryId,
      token,
      status: 'PENDING',
      fullname: input.buyerFullname,
      email: input.buyerEmail,
      phone: input.buyerPhone,
      profession: input.buyerProfession,
      createdAt: now,
      updatedAt: now,
    }, ticketId);

    await this.ticketRepo.save(ticket);

    // 5. Décrémenter les places (atomique en DB)
    await this.categoryRepo.decrementRemaining(category.id);

    // 6. Initier le paiement (ou passer direct si gratuit)
    if (category.isFree) {
      return {
        ticketId,
        providerReference: `FREE_${ticketId}`,
        token,
        isFree: true,
      };
    }

    const payment = await this.paymentProvider.createPayment({
      amount: category.price,
      currency: category.currency,
      ticketId,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      buyerFullname: input.buyerFullname,
      callbackUrl: input.callbackUrl,
    });

    // 7. Émettre l'événement domaine
    DomainEvents.ticketPurchased({
      ticketId,
      eventSlug: event.slug,
      organizationId: event.organizationId,
      categoryId: input.categoryId,
      amount: category.price,
      currency: category.currency,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      buyerFullname: input.buyerFullname,
    });

    return {
      ticketId,
      paymentUrl: payment.paymentUrl,
      providerReference: payment.providerReference,
      token,
      isFree: false,
    };
  }
}
