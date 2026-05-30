import {
  IPaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifyPaymentResult,
} from '../../../application/ports';
import { config } from '../../config/env';
import crypto from 'crypto';

/**
 * Provider Kkiapay — API de paiement mobile money pour l'Afrique de l'Ouest
 * Docs : https://docs.kkiapay.me
 */
export class KkiapayPaymentProvider implements IPaymentProvider {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = config.kkiapay.baseUrl;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Kkiapay fonctionne côté client via leur SDK JS.
    // Côté serveur, on crée une référence et on retourne les données
    // nécessaires au widget frontend.
    //
    // Pour le webhook server-to-server, voir handleWebhook() ci-dessous.

    const providerReference = `KK_${input.ticketId}_${Date.now()}`;

    // L'URL de paiement est construite pour rediriger vers le widget Kkiapay
    const params = new URLSearchParams({
      amount: input.amount.toString(),
      key: config.kkiapay.publicKey,
      callback: input.callbackUrl,
      reference: providerReference,
      data: JSON.stringify({
        ticketId: input.ticketId,
        email: input.buyerEmail,
      }),
    });

    return {
      providerReference,
      paymentUrl: `${this.baseUrl}/payment?${params.toString()}`,
      status: 'PENDING',
    };
  }

  async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/transactions/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-private-key': config.kkiapay.privateKey,
      },
      body: JSON.stringify({ transactionId: providerReference }),
    });

    if (!response.ok) {
      throw new Error(`Kkiapay verify failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      status: string;
      amount?: number;
      completedAt?: string;
    };

    const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PENDING'> = {
      SUCCESS: 'SUCCESS',
      FAILED: 'FAILED',
      PENDING: 'PENDING',
      INVALID_TRANSACTION: 'FAILED',
    };

    return {
      providerReference,
      status: statusMap[data.status] ?? 'FAILED',
      amount: data.amount ?? 0,
      paidAt: data.completedAt ? new Date(data.completedAt) : undefined,
    };
  }

  /**
   * Valide la signature HMAC du webhook Kkiapay.
   * Doit être appelé AVANT de traiter le payload.
   */
  validateWebhookSignature(payload: unknown, signature: string): boolean {
    if (!config.kkiapay.webhookSecret) return false;

    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha256', config.kkiapay.webhookSecret)
      .update(body)
      .digest('hex');

    // Comparaison en temps constant pour éviter les timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expected, 'hex')
      );
    } catch {
      return false;
    }
  }
}
