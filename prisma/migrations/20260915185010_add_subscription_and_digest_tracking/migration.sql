-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastDigestSentAt" TIMESTAMP(3),
ADD COLUMN     "subscribed" BOOLEAN NOT NULL DEFAULT true;
