import { Body, Controller, Get, Headers, Param, Post, RawBodyRequest, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PaymentsService } from "./payments.service";
import { StripePaymentProvider } from "./providers/stripe-payment.provider";
import { CheckoutDto } from "./dto/checkout.dto";

@Controller()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService, private stripeProvider: StripePaymentProvider) {}

  /** Cria a Subscription + PaymentIntent de PIX ou Checkout Session embutida do cartão. */
  @Post("checkout")
  @UseGuards(JwtAuthGuard)
  checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    return this.paymentsService.checkout(req.user.userId, dto);
  }

  /**
   * Status do PIX para o front fazer polling (a cada ~4s). Também é o FALHA SEGURA: se o pagamento
   * já foi pago no Stripe mas o webhook não chegou, ativa a assinatura aqui mesmo — garante que o
   * cliente nunca fique "pagou mas continua bloqueado".
   */
  @Get("payments/status/:subscriptionId")
  @UseGuards(JwtAuthGuard)
  pixStatus(@Req() req: any, @Param("subscriptionId") subscriptionId: string) {
    return this.paymentsService.getPixStatus(req.user.userId, subscriptionId);
  }

  /** Gera um novo QR PIX para a mesma assinatura ainda pendente (QR expirado). */
  @Post("payments/pix/regenerate/:subscriptionId")
  @UseGuards(JwtAuthGuard)
  regeneratePix(@Req() req: any, @Param("subscriptionId") subscriptionId: string) {
    return this.paymentsService.regeneratePix(req.user.userId, subscriptionId);
  }

  /** Endpoint público — devolve a publishable key do Stripe (nunca o secret key). */
  @Get("payments/checkout-config")
  checkoutConfig() {
    return { provider: "STRIPE", publicKey: process.env.STRIPE_PUBLISHABLE_KEY };
  }

  /**
   * Webhook do Stripe (assinaturas, PIX, cobranças recorrentes). Assinado com o header
   * `stripe-signature` — configurar `STRIPE_WEBHOOK_SECRET` (Stripe Dashboard > Developers >
   * Webhooks). Sem o env configurado, recusa por padrão. O body precisa ser bruto (rawBody),
   * pois a assinatura é calculada sobre o payload exato.
   */
  @Post("payments/webhook/stripe")
  webhook(@Req() req: RawBodyRequest<Request>, @Headers("stripe-signature") signature: string | undefined) {
    if (!signature) {
      throw new UnauthorizedException("Assinatura do webhook inválida.");
    }
    const event = this.stripeProvider.constructEvent(req.rawBody ?? Buffer.from(""), signature);
    return this.paymentsService.handleStripeWebhook(event);
  }

  /**
   * Webhook do Mercado Pago (PIX). O MP não usa segredo de assinatura neste setup: o endpoint
   * consulta o pagamento na API do MP e só age se ele existir e estiver "approved". Cadastrar em
   * Mercado Pago > Integrações > Webhooks apontando para
   * https://{$DOMAIN}/api/payments/webhook/mercadopago (evento "payment").
   */
  @Post("payments/webhook/mercadopago")
  mercadopagoWebhook(@Req() req: Request) {
    return this.paymentsService.handleMercadoPagoWebhook((req.body ?? {}) as Record<string, any>);
  }
}
