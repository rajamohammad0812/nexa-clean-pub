# Phase 1: Core Workflow Engine - Implementation Complete

## Overview

Phase 1 implementation of NexaBuilder's enterprise workflow automation platform is now complete. This phase establishes the foundation for workflow execution, triggers, and management capabilities.

## Architecture Components

### 1. Workflow Execution Engine (`src/lib/workflow/engine.ts`)

The core engine handles:

- **Workflow Execution**: Sequential step processing with context management
- **Step Processing**: Support for 7 step types (API calls, delays, transforms, webhooks, email, conditionals, custom)
- **Error Handling**: Retry logic with exponential backoff
- **Logging**: Comprehensive execution tracking
- **Cancellation**: Runtime workflow cancellation support

**Key Features:**

- Asynchronous execution with database persistence
- Step-level retry configuration (1-10 attempts)
- Context passing between steps for data flow
- Conditional step execution based on previous results

### 2. Trigger System (`src/lib/workflow/triggers.ts`)

Automated workflow triggering via:

- **Scheduled Triggers**: Cron-based scheduling with timezone support
- **Webhook Triggers**: HTTP endpoint automation with authentication
- **Event Triggers**: Application event-based automation

**Key Features:**

- Dynamic trigger initialization on system startup
- Webhook authentication (Bearer, API key, HMAC signature)
- Event condition evaluation for selective triggering
- Centralized trigger management and cleanup

### 3. API Routes

#### Workflow Execution (`src/app/api/workflows/execute/route.ts`)

- POST endpoint for manual workflow execution
- User authentication and authorization
- Execution tracking with unique IDs

#### Webhook Handler (`src/app/api/webhooks/[endpoint]/route.ts`)

- Dynamic endpoint routing for webhook triggers
- Multi-method support (GET, POST, PUT, PATCH, DELETE)
- Content-type negotiation and payload parsing

### 4. Workflow Builder UI (`src/components/workflow/WorkflowBuilder.tsx`)

Visual workflow construction with:

- **Drag & Drop Interface**: Intuitive step reordering
- **Step Configuration**: Modal-based step setup
- **Import/Export**: JSON workflow portability
- **Real-time Preview**: Live workflow visualization

**Supported Step Types:**

- API Call: HTTP requests with full configuration
- Delay: Timed execution pauses
- Transform: Data manipulation between steps
- Webhook: Outbound HTTP notifications
- Email: Notification dispatching (placeholder)
- Conditional: Branching logic
- Custom: Extensible step execution

### 5. Utilities

#### Logger (`src/lib/utils/logger.ts`)

- Structured logging with configurable levels
- Contextual logging for component identification
- JSON data serialization for debugging

## Database Schema Updates

The following models support the workflow engine:

```prisma
model Workflow {
  id          String    @id @default(cuid())
  name        String
  description String?
  isActive    Boolean   @default(false)
  userId      String
  steps       WorkflowStep[]
  executions  WorkflowExecution[]
  triggers    WorkflowTrigger[]
}

model WorkflowStep {
  id          String    @id @default(cuid())
  workflowId  String
  name        String
  type        StepType
  config      Json
  order       Int
  conditions  Json?
  retries     Int       @default(3)
}

model WorkflowExecution {
  id           String         @id @default(cuid())
  workflowId   String
  status       ExecutionStatus
  startedAt    DateTime       @default(now())
  finishedAt   DateTime?
  triggerData  Json?
  stepResults  Json?
  error        String?
  triggeredBy  String?
  stepExecutions StepExecution[]
}

model StepExecution {
  id             String         @id @default(cuid())
  executionId    String
  stepId         String
  status         ExecutionStatus
  startedAt      DateTime       @default(now())
  finishedAt     DateTime?
  output         Json?
  error          String?
  logs           String?
  maxAttempts    Int            @default(3)
  attemptNumber  Int            @default(1)
}

model WorkflowTrigger {
  id         String      @id @default(cuid())
  workflowId String
  type       TriggerType
  config     Json
  name       String
  isActive   Boolean     @default(true)
}

enum StepType {
  API_CALL
  DELAY
  TRANSFORM
  WEBHOOK
  EMAIL
  CONDITIONAL
  CUSTOM
}

enum TriggerType {
  SCHEDULE
  WEBHOOK
  EVENT
}

enum ExecutionStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  CANCELLED
}
```

## Usage Examples

### 1. Creating a Simple API Monitoring Workflow

```typescript
const workflow = {
  name: 'API Health Check',
  description: 'Monitor API endpoint and send alerts',
  isActive: true,
  steps: [
    {
      name: 'Health Check',
      type: StepType.API_CALL,
      config: {
        url: 'https://api.example.com/health',
        method: 'GET',
      },
      retries: 3,
    },
    {
      name: 'Check Status',
      type: StepType.CONDITIONAL,
      config: {
        condition: {
          field: 'Health Check.status',
          operator: 'not_equals',
          value: 200,
        },
      },
    },
    {
      name: 'Send Alert',
      type: StepType.WEBHOOK,
      config: {
        url: 'https://hooks.slack.com/webhook',
        method: 'POST',
        body: {
          text: 'API health check failed',
        },
      },
    },
  ],
}
```

### 2. Setting up a Scheduled Trigger

```typescript
await triggerManager.createTrigger(
  workflowId,
  TriggerType.SCHEDULE,
  {
    cronExpression: '0 */5 * * * *', // Every 5 minutes
    timezone: 'America/New_York',
  },
  'Health Check Schedule',
)
```

### 3. Webhook Integration

```typescript
// Webhook endpoint: /api/webhooks/github-deploy
await triggerManager.createTrigger(
  deployWorkflowId,
  TriggerType.WEBHOOK,
  {
    endpoint: 'github-deploy',
    method: 'POST',
    authentication: {
      type: 'signature',
      secret: process.env.GITHUB_WEBHOOK_SECRET,
      headerName: 'X-Hub-Signature-256',
    },
  },
  'GitHub Deploy Trigger',
)
```

## Installation & Setup

1. **Dependencies**: `node-cron` and `@types/node-cron` installed
2. **Database**: Prisma schema migrations applied
3. **Environment**: No additional environment variables required for core functionality

## Next Steps (Phase 2)

- External service integrations (Slack, GitHub, etc.)
- Advanced step types and conditions
- Workflow templates and marketplace
- Performance monitoring and analytics
- Enterprise security features

## API Documentation

### Execute Workflow

```http
POST /api/workflows/execute
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "workflowId": "workflow_id",
  "triggerData": {
    "source": "manual",
    "parameters": {}
  }
}
```

### Webhook Trigger

```http
POST /api/webhooks/{endpoint}
Content-Type: application/json

{
  "data": "webhook payload"
}
```

## Testing

The workflow engine is ready for testing with:

- Manual workflow execution via API
- Scheduled workflow automation
- Webhook-triggered workflows
- Visual workflow builder interface

All components include comprehensive error handling, logging, and database persistence for production readiness.
