-- Tabs dieta/treino + unidades caseiras + histórico renomeável
ALTER TABLE "MealPlan" ADD COLUMN "title" TEXT;
ALTER TABLE "MealItem" ADD COLUMN "quantity" DOUBLE PRECISION;
ALTER TABLE "MealItem" ADD COLUMN "unit" TEXT;
ALTER TABLE "Workout" ADD COLUMN "title" TEXT;

