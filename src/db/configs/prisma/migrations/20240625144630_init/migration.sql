-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "privilege" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION[],
    "timeStarted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdateTime" TIMESTAMP(3) NOT NULL,
    "layersDone" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "layerId" INTEGER NOT NULL,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subquestion" (
    "id" SERIAL NOT NULL,
    "questionText" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "subquestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer" (
    "id" SERIAL NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "answer" TEXT NOT NULL DEFAULT '',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "evaluationId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "layer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "layer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subquestion" ADD CONSTRAINT "subquestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "subquestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
