/*
  Warnings:

  - You are about to drop the column `credential` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleCredential]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_googleId_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "credential",
DROP COLUMN "googleId",
ADD COLUMN     "googleCredential" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_googleCredential_key" ON "user"("googleCredential");
