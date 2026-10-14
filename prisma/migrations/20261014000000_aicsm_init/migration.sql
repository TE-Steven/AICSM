-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "AICSM_Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCommon" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICSM_Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICSM_CheckItem" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "defaultAction" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICSM_CheckItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICSM_Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICSM_Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICSM_Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "painPoints" TEXT,
    "industryId" TEXT NOT NULL,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICSM_Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICSM_CompanyModule" (
    "companyId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICSM_CompanyModule_pkey" PRIMARY KEY ("companyId","moduleId")
);

-- CreateTable
CREATE TABLE "AICSM_CompanyCheckItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "defaultAction" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICSM_CompanyCheckItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICSM_Assessment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICSM_Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICSM_AssessmentResult" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "pathLabel" TEXT NOT NULL,
    "description" TEXT,
    "defaultAction" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "actionNote" TEXT,

    CONSTRAINT "AICSM_AssessmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICSM_Issue" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICSM_Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AICSM_Industry_name_key" ON "AICSM_Industry"("name");

-- CreateIndex
CREATE INDEX "AICSM_CheckItem_industryId_idx" ON "AICSM_CheckItem"("industryId");

-- CreateIndex
CREATE INDEX "AICSM_CheckItem_parentId_idx" ON "AICSM_CheckItem"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "AICSM_Module_name_key" ON "AICSM_Module"("name");

-- CreateIndex
CREATE INDEX "AICSM_Company_industryId_idx" ON "AICSM_Company"("industryId");

-- CreateIndex
CREATE INDEX "AICSM_CompanyModule_moduleId_idx" ON "AICSM_CompanyModule"("moduleId");

-- CreateIndex
CREATE INDEX "AICSM_CompanyCheckItem_companyId_idx" ON "AICSM_CompanyCheckItem"("companyId");

-- CreateIndex
CREATE INDEX "AICSM_CompanyCheckItem_parentId_idx" ON "AICSM_CompanyCheckItem"("parentId");

-- CreateIndex
CREATE INDEX "AICSM_Assessment_companyId_idx" ON "AICSM_Assessment"("companyId");

-- CreateIndex
CREATE INDEX "AICSM_AssessmentResult_assessmentId_idx" ON "AICSM_AssessmentResult"("assessmentId");

-- CreateIndex
CREATE INDEX "AICSM_Issue_companyId_status_idx" ON "AICSM_Issue"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AICSM_Issue_source_externalId_key" ON "AICSM_Issue"("source", "externalId");

-- AddForeignKey
ALTER TABLE "AICSM_CheckItem" ADD CONSTRAINT "AICSM_CheckItem_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "AICSM_Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_CheckItem" ADD CONSTRAINT "AICSM_CheckItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AICSM_CheckItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_Company" ADD CONSTRAINT "AICSM_Company_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "AICSM_Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_CompanyModule" ADD CONSTRAINT "AICSM_CompanyModule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AICSM_Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_CompanyModule" ADD CONSTRAINT "AICSM_CompanyModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AICSM_Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_CompanyCheckItem" ADD CONSTRAINT "AICSM_CompanyCheckItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AICSM_Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_CompanyCheckItem" ADD CONSTRAINT "AICSM_CompanyCheckItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AICSM_CompanyCheckItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_Assessment" ADD CONSTRAINT "AICSM_Assessment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AICSM_Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_AssessmentResult" ADD CONSTRAINT "AICSM_AssessmentResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AICSM_Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AICSM_Issue" ADD CONSTRAINT "AICSM_Issue_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AICSM_Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

