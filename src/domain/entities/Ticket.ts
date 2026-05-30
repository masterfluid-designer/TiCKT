import { Entity } from './Entity';

export type TicketStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'USED';

export interface TicketProps {
  eventId: string;
  categoryId: string;
  token: string;
  status: TicketStatus;
  fullname: string;
  email: string;
  phone: string;
  profession?: string;
  qrUrl?: string;
  ticketUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date;
}

export class Ticket extends Entity<TicketProps> {
  private constructor(props: TicketProps, id: string) {
    super(props, id);
  }

  static create(props: TicketProps, id: string): Ticket {
    return new Ticket(props, id);
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get eventId(): string { return this.props.eventId; }
  get categoryId(): string { return this.props.categoryId; }
  get token(): string { return this.props.token; }
  get status(): TicketStatus { return this.props.status; }
  get fullname(): string { return this.props.fullname; }
  get email(): string { return this.props.email; }
  get phone(): string { return this.props.phone; }
  get profession(): string | undefined { return this.props.profession; }
  get qrUrl(): string | undefined { return this.props.qrUrl; }
  get ticketUrl(): string | undefined { return this.props.ticketUrl; }
  get createdAt(): Date { return this.props.createdAt; }
  get usedAt(): Date | undefined { return this.props.usedAt; }

  // ── Logique métier ───────────────────────────────────────────────────────

  isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  isConfirmed(): boolean {
    return this.props.status === 'CONFIRMED';
  }

  isUsed(): boolean {
    return this.props.status === 'USED';
  }

  isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  canBeScanned(): boolean {
    return this.props.status === 'CONFIRMED';
  }

  confirm(): void {
    if (!this.isPending()) {
      throw new Error(`Cannot confirm a ticket with status: ${this.props.status}`);
    }
    this.props.status = 'CONFIRMED';
    this.props.updatedAt = new Date();
  }

  markAsUsed(): void {
    if (!this.canBeScanned()) {
      throw new Error(`Cannot scan a ticket with status: ${this.props.status}`);
    }
    this.props.status = 'USED';
    this.props.usedAt = new Date();
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.isUsed()) {
      throw new Error('Cannot cancel an already used ticket');
    }
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  setQrUrl(qrUrl: string): void {
    this.props.qrUrl = qrUrl;
    this.props.updatedAt = new Date();
  }

  setTicketUrl(ticketUrl: string): void {
    this.props.ticketUrl = ticketUrl;
    this.props.updatedAt = new Date();
  }
}
