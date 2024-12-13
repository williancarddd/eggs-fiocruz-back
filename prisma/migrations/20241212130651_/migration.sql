/*
  Warnings:

  - You are about to drop the column `created_at` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `eggs_count` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `expected_eggs` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Process` table. All the data in the column will be lost.
  - The `status` column on the `Process` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `User` table. All the data in the column will be lost.
  - The `type` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Process` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COLLECTOR');

-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('PENDING', 'FAILED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Process" DROP COLUMN "created_at",
DROP COLUMN "eggs_count",
DROP COLUMN "expected_eggs",
DROP COLUMN "path",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "eggsCount" INTEGER,
ADD COLUMN     "expectedEggs" INTEGER,
ADD COLUMN     "processMetadataId" TEXT,
ADD COLUMN     "resultPath" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProcessStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "Role" NOT NULL DEFAULT 'COLLECTOR';

-- CreateTable
CREATE TABLE "loginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessMetadata" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "nanoProperties" JSONB,
    "eggAnalysisData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessMetadata_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "loginHistory" ADD CONSTRAINT "loginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_processMetadataId_fkey" FOREIGN KEY ("processMetadataId") REFERENCES "ProcessMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;
