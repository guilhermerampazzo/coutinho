import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import Stripe from "stripe";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  CreatePixPaymentIntentInput,
  PaymentProvider,
  PixPaymentInfo,
  PixPaymentIntentResult,
  PixPaymentStatus,
} from "../payment-provider.interface";

/** Mapeia o status do PaymentIntent para o status PIX da nossa aplicação. */
function mapPixStatus(status: Stripe.PaymentIntent.Status): PixPaymentStatus {
  switch (status) {
    case "succeeded":
      return "paid";
    case "canceled":
      return "expired";
    default:
      return "pending";
  }
}

/**
 * Adapter Stripe (ÚNICO gateway a partir da migração Mercado Pago → Stripe).
 *
 * Checkout é 100% embutido no próprio site (Embedded Checkout, `ui_mode: "embedded"`):
 * cartão vira assinatura recorrente mensal (mode=subscription, com `cancel_at` no fim do período,
 * quando o próprio Stripe cancela) e PIX vira cobrança única do período (mode=payment, restrito a
 * `payment_method_types: ["pix"]`). Apple Pay e Google Pay aparecem automaticamente dentro do
 * Embedded Checkout quando o dispositivo/navegador é elegível.
 *
 * Credenciais vêm do `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` (front) e
 * `STRIPE_WEBHOOK_SECRET` (validação de `stripe-signature`).
 */
@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  readonly name = "STRIPE" as const;

  constructor(private prisma: PrismaService) {}

  private getClient(): Stripe {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new ServiceUnavailableException("STRIPE_SECRET_KEY não configurado.");
    }
    return new Stripe(secretKey, {
      appInfo: { name: "CoutHealth", version: "0.1.0" },
    });
  }

  /** Cria (ou reusa) o Customer do Stripe para o usuário — id fica em `User.stripeCustomerId`. */
  async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
    if (existing?.stripeCustomerId) return existing.stripeCustomerId;

    const customer = await this.getClient().customers.create({
      email,
      name,
      metadata: { userId },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
    return customer.id;
  }

  async createEmbeddedCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
    const client = this.getClient();

    const base = {
      customer: input.stripeCustomerId,
      client_reference_id: input.subscriptionId,
      metadata: { subscriptionId: input.subscriptionId },
      return_url: input.returnUrl,
    };

    if (input.method === "cartao") {
      // Assinatura recorrente mensal. O preço é criado por checkout (valor já com desconto do
      // período/cupom travado) — nada de configurar preço fixo manualmente no painel do Stripe.
      const price = await client.prices.create({
        currency: "brl",
        unit_amount: Math.round(input.monthlyAmount * 100),
        recurring: { interval: "month", interval_count: 1 },
        product_data: { name: `Assinatura CoutHealth — ${input.subscriptionId}` },
      });

      const session = await client.checkout.sessions.create({
        ...base,
        mode: "subscription",
        ui_mode: "embedded",
        line_items: [{ price: price.id, quantity: 1 }],
        // `cancel_at` NÃO é aceito em `subscription_data` no Checkout (API atual do Stripe) — o
        // cancelamento no fim do período é agendado depois, em `setSubscriptionCancelAt`, chamado
        // no webhook checkout.session.completed (quando já temos o id da assinatura criada).
        subscription_data: { metadata: { subscriptionId: input.subscriptionId } },
      });

      return { clientSecret: session.client_secret!, sessionId: session.id, mode: "subscription" };
    }

    // PIX: cobrança única do valor cheio do período. `payment_method_types` restrito a pix para
    // que a aba PIX não ofereça cartão avulso (cartão só entra pela assinatura recorrente).
    const session = await client.checkout.sessions.create({
      ...base,
      mode: "payment",
      ui_mode: "embedded",
      payment_method_types: ["pix"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: Math.round(input.totalAmount * 100),
            product_data: { name: `CoutHealth — período ${input.subscriptionId}` },
          },
          quantity: 1,
        },
      ],
    });

    return { clientSecret: session.client_secret!, sessionId: session.id, mode: "payment" };
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    await this.getClient().subscriptions.cancel(stripeSubscriptionId);
  }

  /**
   * Agenda o cancelamento automático da assinatura para o fim do período contratado
   * (`cancel_at`) — mesma regra de "expira, não renova". Só é chamado após o
   * checkout.session.completed, quando já existe o id da assinatura criada pelo Stripe.
   */
  async setSubscriptionCancelAt(stripeSubscriptionId: string, cancelAt: Date): Promise<void> {
    await this.getClient().subscriptions.update(stripeSubscriptionId, {
      cancel_at: Math.floor(cancelAt.getTime() / 1000),
    });
  }

  /**
   * PIX customizado (fora do Checkout): cria e confirma um PaymentIntent de PIX direto, para
   * que o front renderize o QR, o countdown e o polling por conta própria (ver CheckoutPage).
   * `next_action.pix_display_qr_code` traz o payload e a imagem do QR.
   */
  async createPixPaymentIntent(input: CreatePixPaymentIntentInput): Promise<PixPaymentIntentResult> {
    const client = this.getClient();

    const paymentIntent = await client.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: "brl",
      payment_method_types: ["pix"],
      customer: input.stripeCustomerId,
      confirm: true,
      description: `CoutHealth — PIX ${input.subscriptionId}`,
      metadata: { subscriptionId: input.subscriptionId },
      payment_method_options: {
        pix: { expires_at: Math.floor(input.expiresAt.getTime() / 1000) },
      },
    });

    const pix = paymentIntent.next_action?.pix_display_qr_code;
    return {
      paymentIntentId: paymentIntent.id,
      status: mapPixStatus(paymentIntent.status),
      qrCode: pix?.data ?? "",
      qrCodeImageUrl: pix?.image_url_png ?? "",
      hostedInstructionsUrl: pix?.hosted_instructions_url ?? undefined,
      expiresAt: pix?.expires_at ?? Math.floor(input.expiresAt.getTime() / 1000),
      amount: input.amount,
    };
  }

  /** Consulta o estado atual de um PIX — usado pelo polling do front e pelo fallback de ativação. */
  async retrievePixPayment(paymentIntentId: string): Promise<PixPaymentInfo> {
    const paymentIntent = await this.getClient().paymentIntents.retrieve(paymentIntentId);
    const pix = paymentIntent.next_action?.pix_display_qr_code;
    return {
      status: mapPixStatus(paymentIntent.status),
      qrCode: pix?.data,
      qrCodeImageUrl: pix?.image_url_png,
      hostedInstructionsUrl: pix?.hosted_instructions_url,
      expiresAt: pix?.expires_at,
    };
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<void> {
    await this.getClient().paymentIntents.cancel(paymentIntentId).catch(() => undefined);
  }

  /** Valida a assinatura do webhook (`stripe-signature`) e devolve o evento tipado. */
  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new UnauthorizedException("STRIPE_WEBHOOK_SECRET não configurado.");
    }
    try {
      return this.getClient().webhooks.constructEvent(payload, signature, secret);
    } catch {
      throw new UnauthorizedException("Assinatura do webhook inválida.");
    }
  }
}
