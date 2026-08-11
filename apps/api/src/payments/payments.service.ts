import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Period, PlanCode, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";
import { RemindersQueueService } from "../reminders/reminders-queue.service";
import { StripePaymentProvider } from "./providers/stripe-payment.provider";
import type { PixPaymentInfo } from "./payment-provider.interface";
import { CheckoutDto } from "./dto/checkout.dto";

const PERIOD_DISCOUNT: Record<Period, number> = {
  MENSAL: 0,
  TRIMESTRAL: 0.1,
  SEMESTRAL: 0.2,
  ANUAL: 0.4,
};

const PERIOD_MONTHS: Record<Period, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

/** Validade do QR Code PIX — depois disso o Stripe cancela o PaymentIntent sozinho. */
const PIX_EXPIRATION_MS = 30 * 60 * 1000;

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripeProvider: StripePaymentProvider,
    private reminders: RemindersQueueService
  ) {}

  /**
   * Cria a Subscription (PENDING) e uma Checkout Session embutida do Stripe.
   * - PIX    → mode=payment, cobrança única do valor cheio do período.
   * - Cartão → mode=subscription, recorrente mensal; o Stripe cobra todo mês e cancela sozinho
   *            (`cancel_at`) quando o período contratado termina — sem job de expiração (ver
   *            DECISIONS.md). A liberação acontece no webhook, não aqui.
   */
  async checkout(userId: string, dto: CheckoutDto) {
    const [user, plan] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.plan.findUnique({ where: { code: dto.planCode as PlanCode } }),
    ]);
    if (!plan) throw new NotFoundException("Plano não encontrado.");

    let coupon = null;
    if (dto.couponCode) {
      coupon = await this.prisma.coupon.findUnique({ where: { code: dto.couponCode } });
      if (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt < new Date())) {
        throw new BadRequestException("Cupom inválido ou expirado.");
      }
    }

    const periodDiscount = PERIOD_DISCOUNT[dto.period as Period];
    const couponDiscount = coupon?.percentOff ?? 0;
    const months = PERIOD_MONTHS[dto.period as Period];

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        period: dto.period as Period,
        couponId: coupon?.id,
        status: "PENDING",
      },
    });

    const stripeCustomerId = await this.stripeProvider.getOrCreateCustomer(userId, user.email, user.name);
    const returnUrl = `${process.env.APP_PUBLIC_URL ?? "https://localhost"}/checkout?success=1`;

    if (dto.method === "pix") {
      const totalAmount = Number((plan.monthlyPrice * months * (1 - periodDiscount) * (1 - couponDiscount)).toFixed(2));
      const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MS);
      const pixResult = await this.stripeProvider.createPixPaymentIntent({
        subscriptionId: subscription.id,
        amount: totalAmount,
        stripeCustomerId,
        expiresAt,
      });
      await this.prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          provider: this.stripeProvider.name,
          providerChargeId: pixResult.paymentIntentId,
          amount: totalAmount,
          status: "PENDING",
          method: "pix",
        },
      });
      return {
        subscriptionId: subscription.id,
        method: "pix",
        amount: totalAmount,
        pix: {
          qrCode: pixResult.qrCode,
          qrCodeImageUrl: pixResult.qrCodeImageUrl,
          hostedInstructionsUrl: pixResult.hostedInstructionsUrl,
          expiresAt: pixResult.expiresAt,
        },
      };
    }

    const monthlyAmount = Number((plan.monthlyPrice * (1 - periodDiscount) * (1 - couponDiscount)).toFixed(2));
    const session = await this.stripeProvider.createEmbeddedCheckoutSession({
      subscriptionId: subscription.id,
      method: "cartao",
      stripeCustomerId,
      monthlyAmount,
      totalAmount: 0,
      months,
      returnUrl,
    });
    return { subscriptionId: subscription.id, mode: session.mode, clientSecret: session.clientSecret, amount: monthlyAmount, method: "cartao" };
  }

  /**
   * Status do PIX para o front fazer polling. FALHA SEGURA CRÍTICA: se o webhook não chegou
   * (atraso/config ausente) e o pagamento já está pago no Stripe, ativa a assinatura aqui mesmo —
   * assim o usuário nunca fica "pagou mas continua bloqueado" (bug reportado na fase Mercado Pago).
   */
  async getPixStatus(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription || subscription.userId !== userId) {
      throw new ForbiddenException("Você não tem acesso a este pagamento.");
    }

    const payment = await this.prisma.payment.findFirst({
      where: { subscriptionId, method: "pix" },
      orderBy: { createdAt: "desc" },
    });
    if (!payment?.providerChargeId) {
      return { status: "pending" as const };
    }

    let info: PixPaymentInfo;
    try {
      info = await this.stripeProvider.retrievePixPayment(payment.providerChargeId);
    } catch {
      // PaymentIntent inexistente/inacessível — o front pode regenerar um novo PIX.
      return { status: "failed" as const };
    }

    // Fallback de ativação: pagamento pago mas webhook ainda não processou (ou nunca chegará).
    if (info.status === "paid" && subscription.status === "PENDING") {
      await this.activateSubscription(subscription.id, PERIOD_MONTHS[subscription.period]);
      await this.recordPayment(subscription.id, {
        providerChargeId: payment.providerChargeId,
        amount: payment.amount,
        status: "APPROVED",
        method: "pix",
      });
    }

    if (info.status === "expired" && payment.status === "PENDING") {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }

    return {
      status: info.status,
      expiresAt: info.expiresAt,
      amount: payment.amount,
      ...(info.status === "pending"
        ? {
            qrCode: info.qrCode,
            qrCodeImageUrl: info.qrCodeImageUrl,
            hostedInstructionsUrl: info.hostedInstructionsUrl,
          }
        : {}),
    };
  }

  /**
   * Gera um novo QR PIX para a MESMA assinatura ainda pendente (sem duplicar Subscription),
   * cancelando os PIX antigos não pagos daquele pedido.
   */
  async regeneratePix(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription || subscription.userId !== userId) {
      throw new ForbiddenException("Você não tem acesso a este pagamento.");
    }
    if (subscription.status !== "PENDING") {
      throw new BadRequestException("Esta assinatura já foi ativada.");
    }

    const stale = await this.prisma.payment.findMany({ where: { subscriptionId, method: "pix", status: "PENDING" } });
    for (const p of stale) {
      if (p.providerChargeId) await this.stripeProvider.cancelPaymentIntent(p.providerChargeId);
      await this.prisma.payment.update({ where: { id: p.id }, data: { status: "FAILED" } });
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const plan = await this.prisma.plan.findUniqueOrThrow({ where: { id: subscription.planId } });
    const coupon = subscription.couponId
      ? await this.prisma.coupon.findUnique({ where: { id: subscription.couponId } })
      : null;
    const periodDiscount = PERIOD_DISCOUNT[subscription.period];
    const couponDiscount = coupon?.percentOff ?? 0;
    const months = PERIOD_MONTHS[subscription.period];
    const totalAmount = Number((plan.monthlyPrice * months * (1 - periodDiscount) * (1 - couponDiscount)).toFixed(2));

    const stripeCustomerId = await this.stripeProvider.getOrCreateCustomer(userId, user.email, user.name);
    const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MS);
    const pixResult = await this.stripeProvider.createPixPaymentIntent({
      subscriptionId,
      amount: totalAmount,
      stripeCustomerId,
      expiresAt,
    });
    await this.prisma.payment.create({
      data: {
        subscriptionId,
        provider: this.stripeProvider.name,
        providerChargeId: pixResult.paymentIntentId,
        amount: totalAmount,
        status: "PENDING",
        method: "pix",
      },
    });

    return {
      subscriptionId,
      method: "pix",
      amount: totalAmount,
      pix: {
        qrCode: pixResult.qrCode,
        qrCodeImageUrl: pixResult.qrCodeImageUrl,
        hostedInstructionsUrl: pixResult.hostedInstructionsUrl,
        expiresAt: pixResult.expiresAt,
      },
    };
  }

  /**
   * Webhook do Stripe — a assinatura é ativada/registrada aqui (fonte da verdade é o Stripe).
   * Eventos tratados:
   * - checkout.session.completed       → cartão (subscription): ativa + guarda stripeSubscriptionId.
   *                                      PIX (payment): só ativa se payment_status = "paid" (PIX é
   *                                      assíncrono; senão aguarda o async_payment_succeeded).
   * - checkout.session.async_payment_succeeded → PIX pago: ativa + registra o Payment.
   * - invoice.paid                     → cobrança mensal recorrente: registra cada Payment.
   * - customer.subscription.deleted    → Stripe cancelou (cancel_at chegou): marca EXPIRED + notifica.
   */
  async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await this.findBySession(session);
        if (!subscription) return { ok: false };

        if (session.mode === "subscription" && session.subscription) {
          const stripeSubscriptionId = String(session.subscription);
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: { stripeSubscriptionId },
          });
          // Agenda o cancelamento automático no fim do período (checkout não aceita cancel_at;
          // só a subscription já criada). O webhook customer.subscription.deleted chega depois.
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + PERIOD_MONTHS[subscription.period]);
          await this.stripeProvider.setSubscriptionCancelAt(stripeSubscriptionId, endDate);

          const activated = await this.activateSubscription(subscription.id, PERIOD_MONTHS[subscription.period]);
          if (activated) {
            await this.recordPayment(subscription.id, {
              providerChargeId: session.payment_intent ? String(session.payment_intent) : `session_${session.id}`,
              amount: (session.amount_total ?? 0) / 100,
              status: "APPROVED",
              method: "cartao",
            });
          }
        } else if (session.mode === "payment" && session.payment_status === "paid") {
          await this.onPixPaid(subscription, session);
        }
        return { ok: true };
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await this.findBySession(session);
        if (!subscription) return { ok: false };
        await this.onPixPaid(subscription, session);
        return { ok: true };
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | null;
          payment_intent?: string | null;
        };
        const subscription = await this.prisma.subscription.findUnique({
          where: { stripeSubscriptionId: String(invoice.subscription ?? "") },
        });
        if (!subscription) return { ok: true };
        await this.recordPayment(subscription.id, {
          providerChargeId: invoice.payment_intent ? String(invoice.payment_intent) : `invoice_${invoice.id}`,
          amount: invoice.amount_paid / 100,
          status: "APPROVED",
          method: "cartao",
        });
        return { ok: true };
      }

      // ---- PIX customizado (PaymentIntent) — o evento que confirma o pagamento no Stripe. ----
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const subscriptionId = (paymentIntent.metadata as any)?.subscriptionId;
        if (!subscriptionId) return { ok: true };
        const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
        if (!subscription || subscription.status === "ACTIVE") return { ok: true };
        await this.activateSubscription(subscriptionId, PERIOD_MONTHS[subscription.period]);
        await this.recordPayment(subscriptionId, {
          providerChargeId: paymentIntent.id,
          amount: (paymentIntent.amount ?? 0) / 100,
          status: "APPROVED",
          method: "pix",
        });
        return { ok: true };
      }

      case "payment_intent.canceled": {
        // PIX expirado/cancelado — marca o Payment como FAILED (a Subscription segue PENDING).
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const subscriptionId = (paymentIntent.metadata as any)?.subscriptionId;
        if (subscriptionId) {
          await this.prisma.payment.updateMany({
            where: { subscriptionId, providerChargeId: paymentIntent.id, status: "PENDING" },
            data: { status: "FAILED" },
          });
        }
        return { ok: true };
      }

      case "customer.subscription.deleted": {
        const deleted = event.data.object as Stripe.Subscription;
        const subscription = await this.prisma.subscription.findUnique({
          where: { stripeSubscriptionId: deleted.id },
        });
        if (!subscription || subscription.status !== "ACTIVE") return { ok: true };
        await this.prisma.subscription.update({ where: { id: subscription.id }, data: { status: "EXPIRED" } });
        await this.prisma.notification.create({
          data: {
            userId: subscription.userId,
            type: "PERSONALIZADA",
            title: "Sua assinatura expirou",
            body: "O período que você contratou chegou ao fim. Escolha um plano para continuar seu acompanhamento.",
            sentAt: new Date(),
          },
        });
        return { ok: true };
      }

      default:
        return { ok: false };
    }
  }

  /** Localiza a Subscription pelo client_reference_id/metadata da sessão (criada no checkout). */
  private async findBySession(session: Stripe.Checkout.Session) {
    const ref = session.client_reference_id ?? (session.metadata as any)?.subscriptionId;
    if (!ref) return null;
    return this.prisma.subscription.findUnique({ where: { id: ref } });
  }

  private async onPixPaid(subscription: { id: string; period: Period }, session: Stripe.Checkout.Session) {
    const activated = await this.activateSubscription(subscription.id, PERIOD_MONTHS[subscription.period]);
    if (activated) {
      await this.recordPayment(subscription.id, {
        providerChargeId: session.payment_intent ? String(session.payment_intent) : `session_${session.id}`,
        amount: (session.amount_total ?? 0) / 100,
        status: "APPROVED",
        method: "pix",
      });
    }
  }

  private async activateSubscription(subscriptionId: string, months: number) {
    const current = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!current || current.status !== "PENDING") return false;

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + months);
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "ACTIVE", startedAt: new Date(), currentPeriodEnd },
    });

    // Fluxo de entrada (pedido do cliente): assim que o pagamento é confirmado, o cliente
    // recebe a solicitação de anamnese — notificação na plataforma + primeiro lembrete automático.
    await this.notifyAnamnesisIfPending(current.userId);
    return true;
  }

  /**
   * Se o usuário ainda não concluiu a anamnese (nunca criou ou está em RASCUNHO), cria a
   * notificação "Complete sua anamnese" (sem duplicar: só se não houver uma pendente não lida)
   * e agenda o primeiro lembrete — o worker repete a cada 24h até a anamnese ser enviada.
   */
  private async notifyAnamnesisIfPending(userId: string) {
    const anamnesis = await this.prisma.anamnesis.findUnique({ where: { userId } });
    const pending = !anamnesis || anamnesis.status === "RASCUNHO";
    if (!pending) return;

    const existing = await this.prisma.notification.findFirst({
      where: { userId, title: "Complete sua anamnese", readAt: null },
    });
    if (!existing) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: "PERSONALIZADA",
          title: "Complete sua anamnese",
          body: "Sua assinatura está ativa! Preencha sua anamnese para que a equipe monte seu plano personalizado.",
          sentAt: new Date(),
        },
      });
    }
    await this.reminders.scheduleAnamnesisReminder(userId);
  }

  /** Registra um Payment sem duplicar (mesma providerChargeId só entra uma vez). */
  private async recordPayment(
    subscriptionId: string,
    data: { providerChargeId: string; amount: number; status: PaymentStatus; method: string }
  ) {
    const existing = await this.prisma.payment.findFirst({ where: { subscriptionId, providerChargeId: data.providerChargeId } });
    if (existing) return existing;
    return this.prisma.payment.create({
      data: { subscriptionId, provider: this.stripeProvider.name, ...data },
    });
  }
}
