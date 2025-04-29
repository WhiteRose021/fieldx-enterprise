-- CreateTable
CREATE TABLE "EntityAnalysis" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "analysisData" JSONB NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EntityAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldInteraction" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LayoutFeedback" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "layoutType" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "comments" TEXT,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LayoutFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityAnalysis_entityType_idx" ON "EntityAnalysis"("entityType");

-- CreateIndex
CREATE INDEX "EntityAnalysis_tenantId_idx" ON "EntityAnalysis"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityAnalysis_entityType_tenantId_key" ON "EntityAnalysis"("entityType", "tenantId");

-- CreateIndex
CREATE INDEX "FieldInteraction_entityType_fieldName_idx" ON "FieldInteraction"("entityType", "fieldName");

-- CreateIndex
CREATE INDEX "FieldInteraction_userId_idx" ON "FieldInteraction"("userId");

-- CreateIndex
CREATE INDEX "FieldInteraction_tenantId_idx" ON "FieldInteraction"("tenantId");

-- CreateIndex
CREATE INDEX "LayoutFeedback_entityType_layoutType_idx" ON "LayoutFeedback"("entityType", "layoutType");

-- CreateIndex
CREATE INDEX "LayoutFeedback_userId_idx" ON "LayoutFeedback"("userId");

-- CreateIndex
CREATE INDEX "LayoutFeedback_tenantId_idx" ON "LayoutFeedback"("tenantId");

-- AddForeignKey
ALTER TABLE "EntityAnalysis" ADD CONSTRAINT "EntityAnalysis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldInteraction" ADD CONSTRAINT "FieldInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldInteraction" ADD CONSTRAINT "FieldInteraction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayoutFeedback" ADD CONSTRAINT "LayoutFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayoutFeedback" ADD CONSTRAINT "LayoutFeedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
