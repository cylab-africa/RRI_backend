-- AlterTable
ALTER TABLE "layer" ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "question" ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subquestion" ALTER COLUMN "weight" SET DEFAULT 0,
ALTER COLUMN "weight" SET DATA TYPE DOUBLE PRECISION;
