import { Entity } from './Entity';

export interface TicketCategoryProps {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  remaining: number;
  isActive: boolean;
  sortOrder: number;
  saleStartAt?: Date;
  saleEndAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TicketCategory extends Entity<TicketCategoryProps> {
  private constructor(props: TicketCategoryProps, id: string) {
    super(props, id);
  }

  static create(props: TicketCategoryProps, id: string): TicketCategory {
    return new TicketCategory(props, id);
  }

  get eventId(): string { return this.props.eventId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get price(): number { return this.props.price; }
  get currency(): string { return this.props.currency; }
  get quantity(): number { return this.props.quantity; }
  get remaining(): number { return this.props.remaining; }
  get isActive(): boolean { return this.props.isActive; }
  get isFree(): boolean { return this.props.price === 0; }

  isAvailable(): boolean {
    if (!this.props.isActive) return false;
    if (this.props.remaining <= 0) return false;
    const now = new Date();
    if (this.props.saleStartAt && now < this.props.saleStartAt) return false;
    if (this.props.saleEndAt && now > this.props.saleEndAt) return false;
    return true;
  }

  decrementRemaining(): void {
    if (this.props.remaining <= 0) {
      throw new Error(`Category "${this.props.name}" is sold out`);
    }
    this.props.remaining -= 1;
    this.props.updatedAt = new Date();
  }

  incrementRemaining(): void {
    if (this.props.remaining >= this.props.quantity) {
      throw new Error('Cannot exceed original quantity');
    }
    this.props.remaining += 1;
    this.props.updatedAt = new Date();
  }
}
