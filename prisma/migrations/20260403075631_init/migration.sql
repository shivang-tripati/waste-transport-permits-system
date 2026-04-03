/*
  Warnings:

  - You are about to drop the column `grossWeight` on the `Weighment` table. All the data in the column will be lost.
  - You are about to drop the column `tareWeight` on the `Weighment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('CRITICAL', 'STANDARD', 'TRANSIENT');

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- DropIndex
DROP INDEX "Weighment_plantId_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "Weighment" DROP COLUMN "grossWeight",
DROP COLUMN "tareWeight",
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "firstWeighmentAt" TIMESTAMPTZ(6),
ADD COLUMN     "firstWeight" DOUBLE PRECISION,
ADD COLUMN     "secondWeighmentAt" TIMESTAMPTZ(6),
ADD COLUMN     "secondWeight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "LegacyWeighmentImport" (
    "id" TEXT NOT NULL,
    "slipNo" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "material" TEXT,
    "firstWeight" DOUBLE PRECISION,
    "secondWeight" DOUBLE PRECISION,
    "netWeight" DOUBLE PRECISION,
    "firstWeighAt" TIMESTAMP(3),
    "secondWeighAt" TIMESTAMP(3),
    "supplier" TEXT,
    "location" TEXT,
    "customer" TEXT,
    "rawData" JSONB NOT NULL,
    "importStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyWeighmentImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegacyWeighmentImport_slipNo_idx" ON "LegacyWeighmentImport"("slipNo");

-- CreateIndex
CREATE INDEX "LegacyWeighmentImport_vehicleNo_idx" ON "LegacyWeighmentImport"("vehicleNo");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_priority_idx" ON "Notification"("expiresAt", "priority");
