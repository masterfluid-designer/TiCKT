import { Ticket, TicketStatus } from '../entities/Ticket';
import { Event, EventStatus } from '../entities/Event';
import { TicketCategory } from '../entities/TicketCategory';

// ─── Types partagés ──────────────────────────────────────────────────────────

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── ITicketRepository ───────────────────────────────────────────────────────

export interface ITicketRepository {
  findById(id: string): Promise<Ticket | null>;
  findByToken(token: string): Promise<Ticket | null>;
  findByEventId(eventId: string, options?: PaginationOptions): Promise<PaginatedResult<Ticket>>;
  findByEmail(email: string, eventId: string): Promise<Ticket[]>;
  save(ticket: Ticket): Promise<void>;
  update(ticket: Ticket): Promise<void>;
  countByEventId(eventId: string): Promise<number>;
  countByEventIdAndStatus(eventId: string, status: TicketStatus): Promise<number>;
}

// ─── IEventRepository ────────────────────────────────────────────────────────

export interface IEventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string, organizationId?: string): Promise<Event | null>;
  findByOrganizationId(organizationId: string, options?: PaginationOptions): Promise<PaginatedResult<Event>>;
  findPublished(options?: PaginationOptions): Promise<PaginatedResult<Event>>;
  save(event: Event): Promise<void>;
  update(event: Event): Promise<void>;
  delete(id: string): Promise<void>;
  existsBySlug(slug: string, organizationId: string, excludeId?: string): Promise<boolean>;
}

// ─── ITicketCategoryRepository ───────────────────────────────────────────────

export interface ITicketCategoryRepository {
  findById(id: string): Promise<TicketCategory | null>;
  findByEventId(eventId: string): Promise<TicketCategory[]>;
  save(category: TicketCategory): Promise<void>;
  update(category: TicketCategory): Promise<void>;
  delete(id: string): Promise<void>;
  decrementRemaining(id: string): Promise<void>;  // Opération atomique en DB
  incrementRemaining(id: string): Promise<void>;
}

// ─── IOrganizationRepository ─────────────────────────────────────────────────

export interface IOrganizationRepository {
  findById(id: string): Promise<{ id: string; name: string; slug: string; email: string } | null>;
  findBySlug(slug: string): Promise<{ id: string; name: string } | null>;
  existsBySlug(slug: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}

// ─── IUserRepository ─────────────────────────────────────────────────────────

export interface IUserRepository {
  findById(id: string): Promise<{ id: string; email: string; passwordHash: string; role: string; organizationId: string; firstName: string; lastName: string } | null>;
  findByEmail(email: string, organizationId?: string): Promise<{ id: string; email: string; passwordHash: string; role: string; organizationId: string; firstName: string; lastName: string } | null>;
}
