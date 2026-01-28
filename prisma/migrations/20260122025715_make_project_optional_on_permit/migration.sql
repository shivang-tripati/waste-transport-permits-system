-- DropForeignKey
ALTER TABLE "Permit" DROP CONSTRAINT "Permit_projectId_fkey";

-- AlterTable
ALTER TABLE "Permit" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "licenseNumber" TEXT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSystemAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Permit_companyId_idx" ON "Permit"("companyId");

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
