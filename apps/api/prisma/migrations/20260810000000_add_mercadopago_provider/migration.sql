-- AlterEnum
-- PIX volta para o Mercado Pago (cartão e recorrência seguem no Stripe).
ALTER TYPE "PaymentProviderName" ADD VALUE 'MERCADOPAGO';
