-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'percent',
    "value" INTEGER NOT NULL DEFAULT 0,
    "minSubtotalCents" INTEGER NOT NULL DEFAULT 0,
    "maxDiscountCents" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER NOT NULL DEFAULT 0,
    "maxPerCustomer" INTEGER NOT NULL DEFAULT 0,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementBar" (
    "id" TEXT NOT NULL,
    "messageDe" TEXT NOT NULL DEFAULT '',
    "messageEn" TEXT NOT NULL DEFAULT '',
    "linkUrl" TEXT NOT NULL DEFAULT '',
    "linkLabel" TEXT NOT NULL DEFAULT '',
    "backgroundColor" TEXT NOT NULL DEFAULT '#e3000e',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "scrolling" BOOLEAN NOT NULL DEFAULT false,
    "scrollSeconds" INTEGER NOT NULL DEFAULT 20,
    "fullWidth" BOOLEAN NOT NULL DEFAULT true,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AnnouncementBar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_enabled_code_idx" ON "Coupon"("enabled", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRedemption_orderId_key" ON "CouponRedemption"("orderId");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_email_idx" ON "CouponRedemption"("couponId", "email");

-- CreateIndex
CREATE INDEX "AnnouncementBar_enabled_position_idx" ON "AnnouncementBar"("enabled", "position");

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
