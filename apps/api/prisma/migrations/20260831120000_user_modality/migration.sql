-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('ONLINE', 'PRESENCIAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "modality" "Modality" NOT NULL DEFAULT 'ONLINE';
