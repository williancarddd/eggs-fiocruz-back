/*
  Warnings:

  - Added the required column `ipAddress` to the `LoginHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `LoginHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userAgent` to the `LoginHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LoginHistory" ADD COLUMN     "ipAddress" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "url" TEXT NOT NULL,
ADD COLUMN     "userAgent" TEXT NOT NULL;
