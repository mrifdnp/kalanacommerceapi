-- AlterTable
ALTER TABLE "user" ADD COLUMN     "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE "user_address" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "provincesId" TEXT NOT NULL,
    "citiesId" TEXT NOT NULL,
    "districtsId" TEXT NOT NULL,
    "long" DECIMAL(10,7),
    "lat" DECIMAL(10,7),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_address" ADD CONSTRAINT "user_address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
