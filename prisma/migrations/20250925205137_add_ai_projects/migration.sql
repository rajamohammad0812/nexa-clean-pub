-- CreateEnum
CREATE TYPE "public"."AIProjectStatus" AS ENUM ('GENERATING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."ai_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectType" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "keyFeatures" JSONB NOT NULL,
    "techStack" JSONB NOT NULL,
    "estimatedWeeks" INTEGER,
    "templateId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "generatedFiles" JSONB,
    "projectPath" TEXT,
    "status" "public"."AIProjectStatus" NOT NULL DEFAULT 'GENERATING',
    "generationLogs" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "ai_projects_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ai_projects" ADD CONSTRAINT "ai_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
