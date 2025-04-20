-- AlterTable
ALTER TABLE "User" ADD COLUMN     "recoveryPasswordToken" TEXT,
ADD COLUMN     "recoveryPasswordTokenExpiresAt" TIMESTAMP(3);
