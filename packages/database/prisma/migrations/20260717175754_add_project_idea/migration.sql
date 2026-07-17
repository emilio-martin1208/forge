-- CreateTable
CREATE TABLE "project_ideas" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prdSummary" TEXT NOT NULL,
    "coreFeatures" JSONB NOT NULL,
    "architectureOptions" JSONB NOT NULL,
    "recommendedIndex" INTEGER NOT NULL,
    "recommendationRationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_ideas_ownerUserId_createdAt_idx" ON "project_ideas"("ownerUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "project_ideas" ADD CONSTRAINT "project_ideas_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
