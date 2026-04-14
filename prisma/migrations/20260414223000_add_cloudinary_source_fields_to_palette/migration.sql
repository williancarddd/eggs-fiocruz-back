-- AlterTable
ALTER TABLE "Palette"
ADD COLUMN     "sourceProvider" TEXT,
ADD COLUMN     "sourcePublicId" TEXT,
ADD COLUMN     "sourceAssetId" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "sourceBytes" INTEGER,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "uploadCompletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Palette_processId_sourcePublicId_key" ON "Palette"("processId", "sourcePublicId");

-- CreateIndex
CREATE UNIQUE INDEX "Palette_processId_idempotencyKey_key" ON "Palette"("processId", "idempotencyKey");
