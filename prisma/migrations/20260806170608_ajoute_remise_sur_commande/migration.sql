-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0;
