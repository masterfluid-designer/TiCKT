import { ITicketRepository } from '../../domain/repositories';
import { DomainEvents } from '../../domain/events/DomainEvents';
import { v4 as uuidv4 } from 'uuid';

export type CheckinResult = 'VALID' | 'ALREADY_USED' | 'NOT_FOUND' | 'CANCELLED' | 'PENDING';

export interface ValidateCheckinInput {
  token: string;
  agentId: string;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    deviceId?: string;
  };
}

export interface ValidateCheckinOutput {
  result: CheckinResult;
  ticket?: {
    id: string;
    fullname: string;
    email: string;
    phone: string;
    profession?: string;
    categoryName?: string;
    usedAt?: Date;
  };
  message: string;
}

// Interface minimale pour le repository checkin (injecté séparément)
export interface ICheckinRepository {
  save(checkin: {
    id: string;
    ticketId: string;
    agentId: string;
    validatedAt: Date;
    deviceInfo?: object;
  }): Promise<void>;
}

export class ValidateCheckinUseCase {
  constructor(
    private readonly ticketRepo: ITicketRepository,
    private readonly checkinRepo: ICheckinRepository,
  ) {}

  async execute(input: ValidateCheckinInput): Promise<ValidateCheckinOutput> {
    // 1. Trouver le ticket par token
    const ticket = await this.ticketRepo.findByToken(input.token);

    if (!ticket) {
      DomainEvents.ticketRejected({
        token: input.token,
        reason: 'NOT_FOUND',
        agentId: input.agentId,
      });
      return {
        result: 'NOT_FOUND',
        message: '❌ Ticket introuvable. Token invalide.',
      };
    }

    // 2. Vérifier le statut
    if (ticket.isUsed()) {
      DomainEvents.ticketRejected({
        token: input.token,
        reason: 'ALREADY_USED',
        agentId: input.agentId,
      });
      return {
        result: 'ALREADY_USED',
        message: `⚠️ Ticket déjà utilisé le ${ticket.usedAt?.toLocaleString('fr-FR')}.`,
        ticket: {
          id: ticket.id,
          fullname: ticket.fullname,
          email: ticket.email,
          phone: ticket.phone,
          profession: ticket.profession,
          usedAt: ticket.usedAt,
        },
      };
    }

    if (ticket.isCancelled()) {
      DomainEvents.ticketRejected({
        token: input.token,
        reason: 'CANCELLED',
        agentId: input.agentId,
      });
      return {
        result: 'CANCELLED',
        message: '❌ Ticket annulé. Entrée refusée.',
        ticket: {
          id: ticket.id,
          fullname: ticket.fullname,
          email: ticket.email,
          phone: ticket.phone,
        },
      };
    }

    if (ticket.isPending()) {
      return {
        result: 'PENDING',
        message: '⚠️ Paiement non confirmé pour ce ticket.',
        ticket: {
          id: ticket.id,
          fullname: ticket.fullname,
          email: ticket.email,
          phone: ticket.phone,
        },
      };
    }

    // 3. Ticket CONFIRMED → marquer comme utilisé
    ticket.markAsUsed();
    await this.ticketRepo.update(ticket);

    // 4. Enregistrer le checkin
    const checkinId = uuidv4();
    await this.checkinRepo.save({
      id: checkinId,
      ticketId: ticket.id,
      agentId: input.agentId,
      validatedAt: new Date(),
      deviceInfo: input.deviceInfo,
    });

    // 5. Émettre l'événement domaine
    DomainEvents.ticketScanned({
      ticketId: ticket.id,
      token: ticket.token,
      agentId: input.agentId,
      checkinId,
      validatedAt: new Date(),
    });

    return {
      result: 'VALID',
      message: '✅ Accès autorisé. Bienvenue !',
      ticket: {
        id: ticket.id,
        fullname: ticket.fullname,
        email: ticket.email,
        phone: ticket.phone,
        profession: ticket.profession,
      },
    };
  }
}
