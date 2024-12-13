/*
  Warnings:

  - You are about to drop the column `f_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `l_name` on the `User` table. All the data in the column will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "f_name",
DROP COLUMN "l_name",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT,
    "eggs_count" INTEGER,
    "path" TEXT,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
