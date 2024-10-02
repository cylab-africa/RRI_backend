-- AlterTable
ALTER TABLE "user" ADD COLUMN     "profilePic" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "googleId" DROP NOT NULL;
