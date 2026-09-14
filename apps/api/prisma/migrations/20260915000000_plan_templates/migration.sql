-- Biblioteca de planos prontos (templates reutilizáveis de dieta/treino)
CREATE TABLE "DietTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DietTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkoutTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "letter" TEXT NOT NULL DEFAULT 'A',
    "description" TEXT,
    "content" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkoutTemplate_pkey" PRIMARY KEY ("id")
);
