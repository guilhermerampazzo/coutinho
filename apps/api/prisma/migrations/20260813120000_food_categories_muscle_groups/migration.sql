-- Categorias de alimentos e grupos musculares selecionáveis (briefing BANCOS.pdf 2026-08).
-- Food.category (texto) -> categoryId (FK FoodCategory); ExerciseLibrary.muscleGroup (texto) -> muscleGroupId (FK MuscleGroup).

-- Tabelas de classificação (gerenciáveis pelo painel)
CREATE TABLE "FoodCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FoodCategory_name_key" ON "FoodCategory"("name");

CREATE TABLE "MuscleGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MuscleGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MuscleGroup_name_key" ON "MuscleGroup"("name");

-- Food: campo texto vira FK. Backfill defensivo p/ alimentos órfãos (bancos esvaziados em 2026-08-13, não deve haver).
ALTER TABLE "Food" ADD COLUMN "categoryId" TEXT;

INSERT INTO "FoodCategory" ("id", "name", "order", "createdAt")
SELECT 'cm-cat-outros', 'Outros', 99, now()
WHERE EXISTS (SELECT 1 FROM "Food") AND NOT EXISTS (SELECT 1 FROM "FoodCategory" WHERE "name" = 'Outros');
UPDATE "Food" SET "categoryId" = 'cm-cat-outros' WHERE "categoryId" IS NULL;

ALTER TABLE "Food" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Food" DROP COLUMN "category";
ALTER TABLE "Food" ADD CONSTRAINT "Food_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FoodCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ExerciseLibrary: idem
ALTER TABLE "ExerciseLibrary" ADD COLUMN "muscleGroupId" TEXT;

INSERT INTO "MuscleGroup" ("id", "name", "order", "createdAt")
SELECT 'cm-mg-outros', 'Outros', 99, now()
WHERE EXISTS (SELECT 1 FROM "ExerciseLibrary") AND NOT EXISTS (SELECT 1 FROM "MuscleGroup" WHERE "name" = 'Outros');
UPDATE "ExerciseLibrary" SET "muscleGroupId" = 'cm-mg-outros' WHERE "muscleGroupId" IS NULL;

ALTER TABLE "ExerciseLibrary" ALTER COLUMN "muscleGroupId" SET NOT NULL;
ALTER TABLE "ExerciseLibrary" DROP COLUMN "muscleGroup";
ALTER TABLE "ExerciseLibrary" ADD CONSTRAINT "ExerciseLibrary_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "MuscleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
