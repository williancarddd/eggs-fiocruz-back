/*
  Warnings:

  - You are about to drop the column `expectedEggs` on the `ProcessExecutions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Process" DROP CONSTRAINT "Process_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProcessExecutions" DROP CONSTRAINT "ProcessExecutions_processId_fkey";

-- DropForeignKey
ALTER TABLE "loginHistory" DROP CONSTRAINT "loginHistory_userId_fkey";

-- AlterTable
ALTER TABLE "Process" ADD COLUMN     "expectedEggs" INTEGER;

-- AlterTable
ALTER TABLE "ProcessExecutions" DROP COLUMN "expectedEggs";

-- AddForeignKey
ALTER TABLE "loginHistory" ADD CONSTRAINT "loginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessExecutions" ADD CONSTRAINT "ProcessExecutions_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;
