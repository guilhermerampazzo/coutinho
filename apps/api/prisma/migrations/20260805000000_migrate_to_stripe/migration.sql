-- Migração Mercado Pago → Stripe (agora o ÚNICO gateway — não há MOCK/ASAAS).
-- A plataforma ainda não tem clientes reais (go-live pendente), então os poucos registros de
-- teste com provider MERCADOPAGO são convertidos para STRIPE sem perda.

-- 1. Enum PaymentProviderName: ('MERCADOPAGO') → ('STRIPE')
--    Postgres não permite DROP VALUE em enum, então recria o tipo.
ALTER TYPE "PaymentProviderName" RENAME TO "PaymentProviderName_old";
CREATE TYPE "PaymentProviderName" AS ENUM ('STRIPE');
ALTER TABLE "Payment" ALTER COLUMN "provider" TYPE TEXT;
UPDATE "Payment" SET "provider" = 'STRIPE' WHERE "provider" = 'MERCADOPAGO';
ALTER TABLE "Payment" ALTER COLUMN "provider" TYPE "PaymentProviderName" USING ("provider"::"PaymentProviderName");
DROP TYPE "PaymentProviderName_old";

-- 2. Id da assinatura no Stripe (antes era o preapproval do Mercado Pago)
ALTER TABLE "Subscription" RENAME COLUMN "mpPreapprovalId" TO "stripeSubscriptionId";
ALTER INDEX "Subscription_mpPreapprovalId_key" RENAME TO "Subscription_stripeSubscriptionId_key";

-- 3. Id do Customer no Stripe, criado sob demanda no primeiro checkout
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
