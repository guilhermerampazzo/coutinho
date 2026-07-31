-- Único gateway suportado agora é o Mercado Pago — remove MOCK/ASAAS do enum.
-- Pagamentos antigos de teste feitos via mock/Asaas não convertem pro novo enum; removidos
-- (são só dados de dev/teste, aprovados automaticamente pelo mock — nada de produção real).
-- Compara como texto: neste ponto o enum ainda é ('MOCK','ASAAS') e o literal 'MERCADOPAGO'
-- ainda não existe nele — comparar direto quebra com `invalid input value for enum` (22P02)
-- em qualquer banco novo, impedindo a migration de rodar do zero.
DELETE FROM "Payment" WHERE "provider"::text != 'MERCADOPAGO';

-- Postgres não permite DROP VALUE em enum, então recria o tipo.
ALTER TYPE "PaymentProviderName" RENAME TO "PaymentProviderName_old";
CREATE TYPE "PaymentProviderName" AS ENUM ('MERCADOPAGO');
ALTER TABLE "Payment" ALTER COLUMN "provider" TYPE "PaymentProviderName" USING ("provider"::text::"PaymentProviderName");
DROP TYPE "PaymentProviderName_old";
