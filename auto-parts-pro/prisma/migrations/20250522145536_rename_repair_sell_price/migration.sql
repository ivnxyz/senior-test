/*
  Warnings:

  - You are about to drop the column `markup` on the `repair_orders` table. All the data in the column will be lost.
  - Added the required column `sellPrice` to the `repair_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "repair_orders" DROP COLUMN "markup",
ADD COLUMN     "sellPrice" DOUBLE PRECISION NOT NULL;
