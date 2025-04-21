/*
  Warnings:

  - Added the required column `strategy` to the `LoginHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LoginHistory" ADD COLUMN     "strategy" TEXT NOT NULL;
