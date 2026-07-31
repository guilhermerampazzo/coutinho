import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Period, PlanCode, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RemindersQueueService } from "../reminders/reminders-queue.service";
import { MercadoPagoPaymentProvider } from "./providers/mercadopago-payment.provider";
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

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private mercadoPagoProvider: MercadoPagoPaymentProvider,
    private reminders: RemindersQueueService
  ) {}

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

    if (dto.method === "pix") {
      return this.checkoutPix(subscription.id, plan.monthlyPrice, months, periodDiscount, couponDiscount, user);
    }
    return this.checkoutRecurringCard(subscription.id, dto, plan.monthlyPrice, months, periodDiscount, couponDiscount, user);
  }

  /** PIX continua cobrança única do valor cheio do período — sem recorrência (ver DECISIONS.md). */
  private async checkoutPix(
    subscriptionId: string,
    monthlyPrice: number,
    months: number,
    periodDiscount: number,
    couponDiscount: number,
    user: { name: string; email: string }
  ) {
    const amount = Number((monthlyPrice * months * (1 - periodDiscount) * (1 - couponDiscount)).toFixed(2));

    const charge = await this.mercadoPagoProvider.createCharge({
      subscriptionId,
      amount,
      method: "pix",
      customer: { name: user.name, email: user.email },
    });

    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId,
        provider: this.mercadoPagoProvider.name,
        providerChargeId: charge.providerChargeId,
        amount,
        status: charge.status,
        method: "pix",
      },
    });

    if (charge.status === "APPROVED") {
      await this.activateSubscription(subscriptionId, months);
    }

    return {
      subscriptionId,
      paymentId: payment.id,
      status: charge.status,
      checkoutUrl: charge.checkoutUrl,
      pixQrCode: charge.pixQrCode,
      pixQrCodeImage: charge.pixQrCodeImage,
      amount,
    };
  }

  /**
   * Cartão vira assinatura recorrente mensal (Mercado Pago `/preapproval`, estilo Claude/Netflix):
   * o período escolhido só trava o desconto e por quantos meses a cobrança mensal se repete —
   * ao fim, expira e o cliente precisa escolher de novo (ver reminders-queue.service.ts).
   */
  private async checkoutRecurringCard(
    subscriptionId: string,
    dto: CheckoutDto,
    monthlyPrice: number,
    months: number,
    periodDiscount: number,
    couponDiscount: number,
    user: { name: string; email: string }
  ) {
    if (!dto.token) {
      throw new BadRequestException("Token de cartão ausente — tokenize o cartão no navegador antes do checkout.");
    }
    const monthlyAmount = Number((monthlyPrice * (1 - periodDiscount) * (1 - couponDiscount)).toFixed(2));

    const result = await this.mercadoPagoProvider.createSubscription({
      subscriptionId,
      monthlyAmount,
      months,
      customer: { name: user.name, email: user.email },
      cardToken: dto.token,
    });

    const status: PaymentStatus = result.status === "authorized" ? "APPROVED" : result.status === "cancelled" ? "FAILED" : "PENDING";

    await this.prisma.subscription.update({ where: { id: subscriptionId }, data: { mpPreapprovalId: result.mpPreapprovalId } });

    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId,
        provider: this.mercadoPagoProvider.name,
        providerChargeId: result.mpPreapprovalId,
        amount: monthlyAmount,
        status,
        method: "cartao",
      },
    });

    if (status === "APPROVED") {
      await this.activateSubscription(subscriptionId, months);
    }

    return {
      subscriptionId,
      paymentId: payment.id,
      status,
      checkoutUrl: result.initPoint,
      amount: monthlyAmount,
    };
  }

  async activateSubscription(subscriptionId: string, months: number) {
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + months);
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "ACTIVE", startedAt: new Date(), currentPeriodEnd },
    });
    await this.reminders.scheduleSubscriptionExpiry(subscriptionId, currentPeriodEnd);
  }

  /**
   * Webhook do Mercado Pago pra cobranças recorrentes (assinatura sem plano associado).
   * `subscription_authorized_payment`: uma cobrança mensal aconteceu (sucesso ou falha) — registra o Payment.
   * `subscription_preapproval`: o cliente cancelou a assinatura direto no Mercado Pago — reflete aqui.
   */
  async handleMercadoPagoWebhook(topic: string, dataId: string) {
    if (topic === "subscription_authorized_payment") {
      const authorizedPayment = await this.mercadoPagoProvider.getAuthorizedPayment(dataId);
      const subscription = await this.prisma.subscription.findUnique({ where: { mpPreapprovalId: authorizedPayment.preapprovalId } });
      if (!subscription) return { ok: false };

      const status: PaymentStatus = authorizedPayment.status === "processed" ? "APPROVED" : "FAILED";
      await this.prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          provider: this.mercadoPagoProvider.name,
          providerChargeId: dataId,
          amount: authorizedPayment.transactionAmount,
          status,
          method: "cartao",
        },
      });
      return { ok: true };
    }

    if (topic === "subscription_preapproval") {
      const preapproval = await this.mercadoPagoProvider.getPreapproval(dataId);
      if (preapproval.status !== "cancelled") return { ok: true };

      const subscription = await this.prisma.subscription.findUnique({ where: { mpPreapprovalId: dataId } });
      if (!subscription) return { ok: false };
      await this.prisma.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELED" } });
      await this.reminders.cancelSubscriptionExpiry(subscription.id);
      return { ok: true };
    }

    return { ok: false };
  }
}
