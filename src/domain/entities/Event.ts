import { Entity } from './Entity';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface EventTheme {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  bannerUrl?: string;
  coverImageUrl?: string;
}

export interface EventSocials {
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
}

export interface EventProps {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  address?: string;
  eventDate: Date;
  endDate?: Date;
  status: EventStatus;
  theme: EventTheme;
  socials: EventSocials;
  maxCapacity?: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Event extends Entity<EventProps> {
  private constructor(props: EventProps, id: string) {
    super(props, id);
  }

  static create(props: EventProps, id: string): Event {
    return new Event(props, id);
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | undefined { return this.props.description; }
  get location(): string | undefined { return this.props.location; }
  get eventDate(): Date { return this.props.eventDate; }
  get status(): EventStatus { return this.props.status; }
  get theme(): EventTheme { return this.props.theme; }
  get socials(): EventSocials { return this.props.socials; }
  get maxCapacity(): number | undefined { return this.props.maxCapacity; }
  get isPublic(): boolean { return this.props.isPublic; }
  get createdAt(): Date { return this.props.createdAt; }

  // ── Logique métier ───────────────────────────────────────────────────────

  isDraft(): boolean { return this.props.status === 'DRAFT'; }
  isPublished(): boolean { return this.props.status === 'PUBLISHED'; }
  isCancelled(): boolean { return this.props.status === 'CANCELLED'; }
  isCompleted(): boolean { return this.props.status === 'COMPLETED'; }

  canAcceptTickets(): boolean {
    return this.isPublished() && !this.isPast();
  }

  isPast(): boolean {
    return new Date() > this.props.eventDate;
  }

  publish(): void {
    if (!this.isDraft()) {
      throw new Error(`Cannot publish an event with status: ${this.props.status}`);
    }
    this.props.status = 'PUBLISHED';
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.isCompleted()) {
      throw new Error('Cannot cancel a completed event');
    }
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  updateTheme(theme: Partial<EventTheme>): void {
    this.props.theme = { ...this.props.theme, ...theme };
    this.props.updatedAt = new Date();
  }
}
