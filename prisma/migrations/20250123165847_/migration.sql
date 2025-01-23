/*
  Warnings:

  - You are about to drop the column `expectedEggs` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `resultPath` on the `Process` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Process" DROP COLUMN "expectedEggs",
DROP COLUMN "resultPath";

-- AlterTable
ALTER TABLE "ProcessExecutions" ADD COLUMN     "expectedEggs" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "resultPath" TEXT;
