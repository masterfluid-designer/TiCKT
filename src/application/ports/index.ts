/**
 * Ports = interfaces définissant les contrats des services externes.
 * L'application layer dépend de ces interfaces, jamais des implémentations.
 */

// ─── Payment Port ────────────────────────────────────────────────────────────

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  ticketId: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerFullname: string;
  callbackUrl: string;
}

export interface CreatePaymentResult {
  providerReference: string;
  paymentUrl?: string;      // URL de redirection vers la page de paiement
  status: 'PENDING';
}

export interface VerifyPaymentResult {
  providerReference: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  paidAt?: Date;
}

export interface IPaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(providerReference: string): Promise<VerifyPaymentResult>;
  validateWebhookSignature(payload: unknown, signature: string): boolean;
}

// ─── Email Port ──────────────────────────────────────────────────────────────

export interface SendTicketEmailInput {
  to: string;
  buyerName: string;
  eventName: string;
  eventDate: Date;
  eventLocation?: string;
  categoryName: string;
  ticketUrl: string;
  qrUrl: string;
  token: string;
}

export interface IEmailProvider {
  sendTicketConfirmation(input: SendTicketEmailInput): Promise<{ messageId: string }>;
  sendTicketReminder(input: SendTicketEmailInput): Promise<{ messageId: string }>;
}

// ─── WhatsApp Port ───────────────────────────────────────────────────────────

export interface SendTicketWhatsappInput {
  to: string;           // numéro au format international +229xxxxxxxx
  buyerName: string;
  eventName: string;
  eventDate: Date;
  ticketUrl: string;
  token: string;
}

export interface IWhatsappProvider {
  sendTicketConfirmation(input: SendTicketWhatsappInput): Promise<{ messageId: string }>;
}

// ─── QR Code Port ────────────────────────────────────────────────────────────

export interface GenerateQrCodeInput {
  content: string;      // URL sécurisée ou token uniquement
  size?: number;
}

export interface IQrCodeProvider {
  generateAsDataUrl(input: GenerateQrCodeInput): Promise<string>;
  generateAsBuffer(input: GenerateQrCodeInput): Promise<Buffer>;
}

// ─── Storage Port ────────────────────────────────────────────────────────────

export interface UploadFileInput {
  key: string;          // chemin dans le bucket (ex: qrcodes/EVT26_XK92A8M3NP.png)
  buffer: Buffer;
  contentType: string;
  isPublic?: boolean;
}

export interface IStorageProvider {
  upload(input: UploadFileInput): Promise<{ url: string }>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

// ─── Event Bus Port ──────────────────────────────────────────────────────────

import type { DomainEvent } from '../../domain/events/DomainEvents';

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}
