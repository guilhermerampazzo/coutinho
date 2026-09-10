-- Substitutos por alimento (estilo Nutrium) + perfil profissional para cabeçalho dos PDFs
CREATE TABLE "MealItemSubstitute" (
    "id" TEXT NOT NULL,
    "mealItemId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "notes" TEXT,
    CONSTRAINT "MealItemSubstitute_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MealItemSubstitute_mealItemId_idx" ON "MealItemSubstitute"("mealItemId");
ALTER TABLE "MealItemSubstitute" ADD CONSTRAINT "MealItemSubstitute_mealItemId_fkey" FOREIGN KEY ("mealItemId") REFERENCES "MealItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealItemSubstitute" ADD CONSTRAINT "MealItemSubstitute_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ProfessionalProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Rafael Coutinho',
    "title" TEXT NOT NULL DEFAULT 'Nutricionista',
    "registration" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProfessionalProfile_pkey" PRIMARY KEY ("id")
);
