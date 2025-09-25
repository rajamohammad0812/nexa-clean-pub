-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."StepType" ADD VALUE 'API_CALL';
ALTER TYPE "public"."StepType" ADD VALUE 'DATABASE';
ALTER TYPE "public"."StepType" ADD VALUE 'EMAIL';
ALTER TYPE "public"."StepType" ADD VALUE 'WEBHOOK';
ALTER TYPE "public"."StepType" ADD VALUE 'DELAY';
ALTER TYPE "public"."StepType" ADD VALUE 'TRANSFORM';

-- AlterTable
ALTER TABLE "public"."workflow_executions" ADD COLUMN     "currentStep" TEXT,
ADD COLUMN     "stepResults" JSONB,
ADD COLUMN     "triggerData" JSONB,
ADD COLUMN     "triggeredBy" TEXT;

-- CreateTable
CREATE TABLE "public"."step_executions" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" "public"."ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "logs" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "step_executions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."step_executions" ADD CONSTRAINT "step_executions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "public"."workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
