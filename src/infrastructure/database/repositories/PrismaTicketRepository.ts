import { PrismaClient } from '@prisma/client';
import { ITicketRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { Ticket, TicketStatus } from '../../../domain/entities/Ticket';

export class PrismaTicketRepository implements ITicketRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Ticket | null> {
    const row = await this.db.ticket.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByToken(token: string): Promise<Ticket | null> {
    const row = await this.db.ticket.findUnique({ where: { token } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEventId(
    eventId: string,
    options: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<Ticket>> {
    const skip = (options.page - 1) * options.limit;

    const [rows, total] = await Promise.all([
      this.db.ticket.findMany({
        where: { eventId },
        skip,
        take: options.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.ticket.count({ where: { eventId } }),
    ]);

    return {
      data: rows.map(r => this.toDomain(r)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async findByEmail(email: string, eventId: string): Promise<Ticket[]> {
    const rows = await this.db.ticket.findMany({
      where: { email, eventId },
    });
    return rows.map(r => this.toDomain(r));
  }

  async save(ticket: Ticket): Promise<void> {
    const data = ticket.toJSON();
    await this.db.ticket.create({
      data: {
        id: data.id,
        eventId: data.eventId,
        categoryId: data.categoryId,
        token: data.token,
        status: data.status,
        fullname: data.fullname,
        email: data.email,
        phone: data.phone,
        profession: data.profession ?? null,
        qrUrl: data.qrUrl ?? null,
        ticketUrl: data.ticketUrl ?? null,
        metadata: data.metadata ?? undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  async update(ticket: Ticket): Promise<void> {
    const data = ticket.toJSON();
    await this.db.ticket.update({
      where: { id: data.id },
      data: {
        status: data.status,
        qrUrl: data.qrUrl ?? null,
        ticketUrl: data.ticketUrl ?? null,
        usedAt: data.usedAt ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async countByEventId(eventId: string): Promise<number> {
    return this.db.ticket.count({ where: { eventId } });
  }

  async countByEventIdAndStatus(eventId: string, status: TicketStatus): Promise<number> {
    return this.db.ticket.count({ where: { eventId, status } });
  }

  private toDomain(row: {
    id: string;
    eventId: string;
    categoryId: string;
    token: string;
    status: string;
    fullname: string;
    email: string;
    phone: string;
    profession: string | null;
    qrUrl: string | null;
    ticketUrl: string | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    usedAt: Date | null;
  }): Ticket {
    return Ticket.create(
      {
        eventId: row.eventId,
        categoryId: row.categoryId,
        token: row.token,
        status: row.status as TicketStatus,
        fullname: row.fullname,
        email: row.email,
        phone: row.phone,
        profession: row.profession ?? undefined,
        qrUrl: row.qrUrl ?? undefined,
        ticketUrl: row.ticketUrl ?? undefined,
        metadata: (row.metadata as Record<string, unknown>) ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        usedAt: row.usedAt ?? undefined,
      },
      row.id
    );
  }
}
