import type { PaymentProviderName } from "@prisma/client";

export type ChargeMethod = "pix" | "cartao";

/** Status de um pagamento PIX (Mercado Pago). */
export type PixPaymentStatus = "pending" | "paid" | "expired" | "failed";

/** Entrada para criar um PaymentIntent de PIX no Stripe. */
export interface CreatePixPaymentIntentInput {
  subscriptionId: string;
  /** Valor único do PIX em reais (já com desconto de período/cupom). */
  amount: number;
  /** Id do Customer no Stripe (User.stripeCustomerId). */
  stripeCustomerId: string;
  /** Quando o QR Code expira (o Stripe cancela o PIX automaticamente). */
  expiresAt: Date;
}

/** Entrada para criar um PIX no Mercado Pago (única forma de pagamento do MP neste app). */
export interface CreatePixChargeInput {
  subscriptionId: string;
  /** Valor único do PIX em reais (já com desconto de período/cupom). */
  amount: number;
  /** E-mail do pagador (obrigatório pelo Mercado Pago). */
  customerEmail: string;
  /** Quando o QR Code expira (o Mercado Pago cancela o PIX automaticamente). */
  expiresAt: Date;
}

export interface PixPaymentIntentResult {
  paymentIntentId: string;
  status: PixPaymentStatus;
  /** Payload bruto do QR — usado pelo botão "Copiar código PIX". */
  qrCode: string;
  /** URL PNG do QR — usado como src do <img>. */
  qrCodeImageUrl: string;
  hostedInstructionsUrl?: string;
  /** Timestamp (segundos) em que o QR expira. */
  expiresAt: number;
  amount: number;
}

/** Informações de status + QR de um PIX consultado depois da criação (para polling/retomada). */
export interface PixPaymentInfo {
  status: PixPaymentStatus;
  qrCode?: string;
  qrCodeImageUrl?: string;
  hostedInstructionsUrl?: string;
  expiresAt?: number;
  /** Id da assinatura no app (external_reference do Mercado Pago) — usado pelo webhook. */
  externalReference?: string;
  amount?: number;
}

/** Entrada para criar uma sessão de checkout embutido no Stripe (Embedded Checkout). */
export interface CreateCheckoutSessionInput {
  subscriptionId: string;
  method: ChargeMethod;
  /** Id do Customer no Stripe (User.stripeCustomerId). */
  stripeCustomerId: string;
  /** Valor mensal da assinatura recorrente (cartão) em reais — já com desconto de período/cupom. */
  monthlyAmount: number;
  /** Valor único do período (PIX) em reais — já com desconto de período/cupom. */
  totalAmount: number;
  /** Quantos meses até a assinatura expirar (cartão usa `cancel_at`; o Stripe cancela sozinho). */
  months: number;
  /** Para onde o Stripe devolve o cliente após o pagamento (Embedded Checkout). */
  returnUrl: string;
}

export interface CreateCheckoutSessionResult {
  /** client_secret da Checkout Session — usado pelo `stripe.initEmbeddedCheckout` no navegador. */
  clientSecret: string;
  sessionId: string;
  /** Modo da sessão: "payment" (PIX, cobrança única) ou "subscription" (cartão, recorrente). */
  mode: "payment" | "subscription";
}

export interface PaymentProvider {
  readonly name: "STRIPE";
  getOrCreateCustomer(userId: string, email: string, name: string): Promise<string>;
  createEmbeddedCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult>;
  /** Cancela uma assinatura recorrente no Stripe — expiração automática ou admin desativando. */
  cancelSubscription(stripeSubscriptionId: string): Promise<void>;
  /** Agenda o cancelamento automático da assinatura no fim do período (`cancel_at`). */
  setSubscriptionCancelAt(stripeSubscriptionId: string, cancelAt: Date): Promise<void>;
  /** Cria e confirma um PaymentIntent de PIX — retorna o QR para exibir. */
  createPixPaymentIntent(input: CreatePixPaymentIntentInput): Promise<PixPaymentIntentResult>;
  /** Consulta o estado atual de um PIX (usado pelo polling de status). */
  retrievePixPayment(paymentIntentId: string): Promise<PixPaymentInfo>;
  /** Cancela um PIX ainda não pago (ex.: antes de gerar um novo QR). */
  cancelPaymentIntent(paymentIntentId: string): Promise<void>;
}

/** Provider de PIX (implementado pelo Mercado Pago). O Stripe segue cuidando do cartão. */
export interface PixProvider {
  readonly name: PaymentProviderName;
  /** Cria uma cobrança PIX — retorna o QR para exibir. */
  createPixCharge(input: CreatePixChargeInput): Promise<PixPaymentIntentResult>;
  /** Consulta o estado atual de um PIX (polling do front + webhook). */
  retrievePixPayment(paymentId: string): Promise<PixPaymentInfo>;
  /** Cancela um PIX ainda não pago (ex.: antes de gerar um novo QR). */
  cancelPaymentIntent(paymentId: string): Promise<void>;
}
