import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type {
  CreatePixChargeInput,
  PixPaymentInfo,
  PixPaymentIntentResult,
  PixPaymentStatus,
  PixProvider,
} from "../payment-provider.interface";

/** Mapeia o status do Mercado Pago para o status PIX da nossa aplicação. */
function mapMpStatus(status: string): PixPaymentStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "cancelled":
      return "expired";
    case "rejected":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Adapter Mercado Pago — PIX (única modalidade que o MP processa neste app; cartão e
 * recorrência continuam no Stripe). Credencial vem de env var `MERCADOPAGO_ACCESS_TOKEN`.
 *
 * Usa a API de Payments (`/v1/payments`): cria o PIX (QR copia-e-cola + imagem em base64) e
 * consulta/cancela depois. O pagamento pago ativa a assinatura via webhook
 * (`/api/payments/webhook/mercadopago`) OU pelo polling de status do front (falha segura).
 */
@Injectable()
export class MercadoPagoPixProvider implements PixProvider {
  readonly name = "MERCADOPAGO" as const;

  private readonly baseUrl = "https://api.mercadopago.com";

  private getAccessToken(): string {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new ServiceUnavailableException("MERCADOPAGO_ACCESS_TOKEN não configurado.");
    }
    return accessToken;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAccessToken()}`,
        ...(init.headers ?? {}),
      },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ServiceUnavailableException(`Falha ao consultar Mercado Pago (${res.status}): ${JSON.stringify(body)}`);
    }
    return body as T;
  }

  async createPixCharge(input: CreatePixChargeInput): Promise<PixPaymentIntentResult> {
    const payment = await this.request<Record<string, any>>("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": `${input.subscriptionId}-${Date.now()}` },
      body: JSON.stringify({
        transaction_amount: Number(input.amount.toFixed(2)),
        description: `CoutHealth - PIX ${input.subscriptionId}`,
        payment_method_id: "pix",
        external_reference: input.subscriptionId,
        payer: { email: input.customerEmail },
        date_of_expiration: input.expiresAt.toISOString(),
      }),
    });

    const td = (payment?.point_of_interaction as any)?.transaction_data ?? {};
    return {
      paymentIntentId: String(payment.id),
      status: mapMpStatus(payment.status ?? ""),
      qrCode: td.qr_code ?? "",
      qrCodeImageUrl: td.qr_code_base64 ? `data:image/gif;base64,${td.qr_code_base64}` : "",
      hostedInstructionsUrl: td.ticket_url ?? undefined,
      expiresAt: this.toEpochSeconds(payment.date_of_expiration) ?? Math.floor(input.expiresAt.getTime() / 1000),
      amount: input.amount,
    };
  }

  async retrievePixPayment(paymentId: string): Promise<PixPaymentInfo> {
    const payment = await this.request<Record<string, any>>(`/v1/payments/${encodeURIComponent(paymentId)}`);
    const td = (payment?.point_of_interaction as any)?.transaction_data ?? {};
    return {
      status: mapMpStatus(payment.status ?? ""),
      qrCode: td.qr_code,
      qrCodeImageUrl: td.qr_code_base64 ? `data:image/gif;base64,${td.qr_code_base64}` : undefined,
      hostedInstructionsUrl: td.ticket_url ?? undefined,
      expiresAt: this.toEpochSeconds(payment.date_of_expiration),
      externalReference: payment.external_reference ?? undefined,
      amount: payment.transaction_amount ?? undefined,
    };
  }

  async cancelPaymentIntent(paymentId: string): Promise<void> {
    await this.request(`/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    }).catch(() => undefined);
  }

  private toEpochSeconds(iso?: string | null): number | undefined {
    if (!iso) return undefined;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
  }
}
