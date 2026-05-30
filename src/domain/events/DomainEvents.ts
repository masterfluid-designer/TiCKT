/**
 * Domain Events — représentent des faits passés dans le domaine.
 * Ils sont immuables et nommés au passé.
 */

export interface DomainEvent {
  readonly eventId: string;       // ID de l'événement de domaine (UUID)
  readonly occurredAt: Date;
  readonly eventType: string;
}

// ─── Factory helper ──────────────────────────────────────────────────────────

function createEvent<T extends DomainEvent>(
  eventType: string,
  payload: Omit<T, 'eventId' | 'occurredAt' | 'eventType'>
): T {
  return {
    eventId: crypto.randomUUID(),
    occurredAt: new Date(),
    eventType,
    ...payload,
  } as T;
}

// ─── Ticket Events ───────────────────────────────────────────────────────────

export interface TicketPurchasedEvent extends DomainEvent {
  eventType: 'TicketPurchased';
  ticketId: string;
  eventSlug: string;
  organizationId: string;
  categoryId: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerFullname: string;
}

export interface PaymentValidatedEvent extends DomainEvent {
  eventType: 'PaymentValidated';
  ticketId: string;
  paymentId: string;
  providerReference: string;
  amount: number;
}

export interface TicketGeneratedEvent extends DomainEvent {
  eventType: 'TicketGenerated';
  ticketId: string;
  token: string;
  qrUrl: string;
  ticketUrl: string;
}

export interface TicketSentByEmailEvent extends DomainEvent {
  eventType: 'TicketSentByEmail';
  ticketId: string;
  recipientEmail: string;
  notificationId: string;
}

export interface TicketSentByWhatsappEvent extends DomainEvent {
  eventType: 'TicketSentByWhatsapp';
  ticketId: string;
  recipientPhone: string;
  notificationId: string;
}

export interface TicketScannedEvent extends DomainEvent {
  eventType: 'TicketScanned';
  ticketId: string;
  token: string;
  agentId: string;
  checkinId: string;
  validatedAt: Date;
}

export interface TicketRejectedEvent extends DomainEvent {
  eventType: 'TicketRejected';
  token: string;
  reason: 'NOT_FOUND' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID';
  agentId: string;
}

// ─── Factories ───────────────────────────────────────────────────────────────

export const DomainEvents = {
  ticketPurchased: (payload: Omit<TicketPurchasedEvent, 'eventId' | 'occurredAt' | 'eventType'>) =>
    createEvent<TicketPurchasedEvent>('TicketPurchased', payload),

  paymentValidated: (payload: Omit<PaymentValidatedEvent, 'eventId' | 'occurredAt' | 'eventType'>) =>
    createEvent<PaymentValidatedEvent>('PaymentValidated', payload),

  ticketGenerated: (payload: Omit<TicketGeneratedEvent, 'eventId' | 'occurredAt' | 'eventType'>) =>
    createEvent<TicketGeneratedEvent>('TicketGenerated', payload),

  ticketSentByEmail: (payload: Omit<TicketSentByEmailEvent, 'eventId' | 'occurredAt' | 'eventType'>) =>
    createEvent<TicketSentByEmailEvent>('TicketSentByEmail', payload),

  ticketSentByWhatsapp: (payload: Omit<TicketSentByWhatsappEvent, 'eventId' | 'occurredAt' | 'eventType'>) =>
    createEvent<TicketSentByWhatsappEvent>('TicketSentByWhatsapp', payload),

  ticketScanned: (payload: Omit<TicketScannedEvent, 'eventId' | 'occurredAt' | 'eventType'>) =>
    createEvent<TicketScannedEvent>('TicketScanned', payload),

  ticketRejected: (payload: Omit<TicketRejectedEvent, 'eventId' | 'occurredAt' | 'eventType'>) =>
    createEvent<TicketRejectedEvent>('TicketRejected', payload),
};
