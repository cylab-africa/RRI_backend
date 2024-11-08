/*
  Warnings:

  - You are about to drop the column `scores` on the `evaluation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "evaluation" DROP COLUMN "scores",
ADD COLUMN     "score" DOUBLE PRECISION[];
