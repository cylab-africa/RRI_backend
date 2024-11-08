/*
  Warnings:

  - You are about to drop the column `answer` on the `answer` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `answer` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `answer` table. All the data in the column will be lost.
  - You are about to drop the column `decription` on the `evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `layersDone` on the `evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `timeStarted` on the `evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `layer` table. All the data in the column will be lost.
  - You are about to drop the column `dateCreated` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `layerId` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `questionText` on the `subquestion` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `subquestion` table. All the data in the column will be lost.
  - You are about to drop the column `privilege` on the `user` table. All the data in the column will be lost.
  - Added the required column `order` to the `layer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `principleId` to the `question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `question` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `subquestion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'PROJECT_LEAD');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SCORE', 'CHOICE', 'OPEN');

-- DropForeignKey
ALTER TABLE "answer" DROP CONSTRAINT "answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "question" DROP CONSTRAINT "question_layerId_fkey";

-- AlterTable
ALTER TABLE "answer" DROP COLUMN "answer",
DROP COLUMN "questionId",
DROP COLUMN "weight",
ADD COLUMN     "response" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "subQuestionId" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "evaluation" DROP COLUMN "decription",
DROP COLUMN "layersDone",
DROP COLUMN "score",
DROP COLUMN "timeStarted",
ADD COLUMN     "completedLayers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scores" DOUBLE PRECISION[],
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "layer" DROP COLUMN "value",
ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "project" DROP COLUMN "dateCreated",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "question" DROP COLUMN "layerId",
DROP COLUMN "number",
DROP COLUMN "question",
DROP COLUMN "weight",
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "principleId" INTEGER NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subquestion" DROP COLUMN "questionText",
DROP COLUMN "weight",
ADD COLUMN     "text" TEXT NOT NULL DEFAULT '',
DROP COLUMN "type",
ADD COLUMN     "type" "QuestionType" NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "privilege",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "principle" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "layerId" INTEGER NOT NULL,

    CONSTRAINT "principle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "principle" ADD CONSTRAINT "principle_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "layer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_principleId_fkey" FOREIGN KEY ("principleId") REFERENCES "principle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_subQuestionId_fkey" FOREIGN KEY ("subQuestionId") REFERENCES "subquestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
