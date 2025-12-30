/*
  Warnings:

  - You are about to drop the column `product_id` on the `cart_item` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `discount_nominal_1` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `discount_percent_1` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `price_1` on the `product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cart_id,product_variant_id]` on the table `cart_item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product_variant_id` to the `cart_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceAtPurchase` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_variant_id` to the `order_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cart_item" DROP CONSTRAINT "cart_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "order_item" DROP CONSTRAINT "order_item_product_id_fkey";

-- DropIndex
DROP INDEX "cart_item_cart_id_product_id_key";

-- AlterTable
ALTER TABLE "cart_item" DROP COLUMN "product_id",
ADD COLUMN     "product_variant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "order_item" DROP COLUMN "product_id",
ADD COLUMN     "priceAtPurchase" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "product_variant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "product" DROP COLUMN "discount_nominal_1",
DROP COLUMN "discount_percent_1",
DROP COLUMN "price_1";

-- CreateTable
CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "variant_name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "original_price" DECIMAL(10,2),
    "qty_multiplier" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cart_item_cart_id_product_variant_id_key" ON "cart_item"("cart_id", "product_variant_id");

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
