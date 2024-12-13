/*
  Warnings:

  - You are about to drop the column `algorithm` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `eggsCount` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `expectedEggs` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `processMetadataId` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the `ProcessMetadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Process" DROP CONSTRAINT "Process_processMetadataId_fkey";

-- AlterTable
ALTER TABLE "Process" DROP COLUMN "algorithm",
DROP COLUMN "eggsCount",
DROP COLUMN "expectedEggs",
DROP COLUMN "processMetadataId",
DROP COLUMN "status";

-- DropTable
DROP TABLE "ProcessMetadata";

-- CreateTable
CREATE TABLE "ProcessExecutions" (
    "id" TEXT NOT NULL,
    "processId" TEXT,
    "eggsCount" INTEGER,
    "expectedEggs" INTEGER,
    "algorithm" TEXT,
    "status" "ProcessStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessExecutions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProcessExecutions" ADD CONSTRAINT "ProcessExecutions_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;
