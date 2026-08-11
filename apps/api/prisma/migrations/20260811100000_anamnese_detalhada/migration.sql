-- Anamnese detalhada (estrutura aprovada pelo cliente — 2026-08):
-- 6 etapas, perguntas condicionais com gates booleanos, campos de detalhe novos
-- e avaliação física com altura/peitoral.
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'COMPOSICAO_CORPORAL';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'OUTRO';

ALTER TABLE "Anamnesis" ADD COLUMN "goalImprove" TEXT,
ADD COLUMN "currentDiet" TEXT,
ADD COLUMN "foodsAvoided" TEXT,
ADD COLUMN "workRoutine" TEXT,
ADD COLUMN "mealsOut" TEXT,
ADD COLUMN "routineDifficulties" TEXT,
ADD COLUMN "sedentarySince" TEXT,
ADD COLUMN "trainingHistory" TEXT,
ADD COLUMN "enjoyedExercises" TEXT,
ADD COLUMN "pain" TEXT,
ADD COLUMN "limitations" TEXT,
ADD COLUMN "injuries" TEXT,
ADD COLUMN "hasDiseases" BOOLEAN,
ADD COLUMN "usesMedications" BOOLEAN,
ADD COLUMN "hasAllergies" BOOLEAN,
ADD COLUMN "hasIntolerances" BOOLEAN,
ADD COLUMN "hasNutritionalDeficiencies" BOOLEAN,
ADD COLUMN "hadSurgeries" BOOLEAN,
ADD COLUMN "hasFamilyHistory" BOOLEAN,
ADD COLUMN "hasOrthopedicIssues" BOOLEAN,
ADD COLUMN "hasAlteredExams" BOOLEAN,
ADD COLUMN "usesSupplements" BOOLEAN,
ADD COLUMN "practicesActivity" BOOLEAN,
ADD COLUMN "hasBioimpedance" BOOLEAN;

ALTER TABLE "Assessment" ADD COLUMN "heightCm" DOUBLE PRECISION,
ADD COLUMN "chestCm" DOUBLE PRECISION;
