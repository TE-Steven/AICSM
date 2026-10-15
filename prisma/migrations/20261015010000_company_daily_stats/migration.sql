-- AlterTable
ALTER TABLE "AICSM_Company" DROP COLUMN "manualStats";

-- CreateTable
CREATE TABLE "AICSM_CompanyDailyStat" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "aiServiceCount" INTEGER,
    "aiRecognitionRate" DOUBLE PRECISION,
    "aiSatisfaction" DOUBLE PRECISION,
    "aiTransferRate" DOUBLE PRECISION,
    "agentServiceCount" INTEGER,
    "agentSatisfaction" DOUBLE PRECISION,
    "ticketCount" INTEGER,
    "aiTopIssueCategory" TEXT,
    "agentTopIssueCategory" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICSM_CompanyDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AICSM_CompanyDailyStat_companyId_date_idx" ON "AICSM_CompanyDailyStat"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AICSM_CompanyDailyStat_companyId_date_key" ON "AICSM_CompanyDailyStat"("companyId", "date");

-- AddForeignKey
ALTER TABLE "AICSM_CompanyDailyStat" ADD CONSTRAINT "AICSM_CompanyDailyStat_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AICSM_Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

