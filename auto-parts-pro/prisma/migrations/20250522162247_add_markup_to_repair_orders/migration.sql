/*
  Warnings:

  - Added the required column `markUp` to the `repair_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "repair_orders" ADD COLUMN     "markUp" DOUBLE PRECISION NOT NULL;
