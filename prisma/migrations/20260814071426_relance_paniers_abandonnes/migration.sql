-- CreateTable
CREATE TABLE "CheckoutRecovery" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "cartJson" TEXT NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "resumeToken" TEXT NOT NULL,
    "lastStep" TEXT NOT NULL DEFAULT 'contact',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "nextSendAt" TIMESTAMP(3),
    "sendAttempts" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3),
    "stoppedReason" TEXT NOT NULL DEFAULT '',
    "stoppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRecovery_emailNormalized_key" ON "CheckoutRecovery"("emailNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRecovery_resumeToken_key" ON "CheckoutRecovery"("resumeToken");

-- CreateIndex
CREATE INDEX "CheckoutRecovery_nextSendAt_idx" ON "CheckoutRecovery"("nextSendAt");

-- CreateIndex
CREATE INDEX "CheckoutRecovery_createdAt_idx" ON "CheckoutRecovery"("createdAt");
