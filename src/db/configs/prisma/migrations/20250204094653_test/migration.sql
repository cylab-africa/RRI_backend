-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'PROJECT_LEAD');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "googleCredential" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "score" DOUBLE PRECISION[],
    "principleScores" JSONB,
    "questionScores" JSONB,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdateTime" TIMESTAMP(3) NOT NULL,
    "completedLayers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principle" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "layerId" INTEGER NOT NULL,

    CONSTRAINT "principle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "principleId" INTEGER NOT NULL,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subquestion" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "subquestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer" (
    "id" SERIAL NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "response" TEXT NOT NULL DEFAULT '',
    "evaluationId" INTEGER NOT NULL,
    "subQuestionId" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_googleCredential_key" ON "user"("googleCredential");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "principle" ADD CONSTRAINT "principle_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "layer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_principleId_fkey" FOREIGN KEY ("principleId") REFERENCES "principle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subquestion" ADD CONSTRAINT "subquestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_subQuestionId_fkey" FOREIGN KEY ("subQuestionId") REFERENCES "subquestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
