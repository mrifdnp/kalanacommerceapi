/*
  Warnings:

  - You are about to alter the column `cogs` on the `product` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "product" ALTER COLUMN "cogs" SET DEFAULT 0,
ALTER COLUMN "cogs" SET DATA TYPE DECIMAL(10,2);
