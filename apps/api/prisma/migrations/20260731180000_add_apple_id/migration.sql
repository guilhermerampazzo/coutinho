-- Sign in with Apple: identificador estável do usuário na Apple (claim `sub` do id_token).
ALTER TABLE "User" ADD COLUMN "appleId" TEXT;
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");
