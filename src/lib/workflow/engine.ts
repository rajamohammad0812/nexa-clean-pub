/**
 * NexaBuilder Workflow Execution Engine
 * Handles the execution of workflows with step processing, error handling, and retry logic
 */

import { prisma } from '@/lib/prisma'
import { ExecutionStatus, StepType, WorkflowStep, Prisma } from '@prisma/client'
import { Logger } from '@/lib/utils/logger'

export interface WorkflowContext {
  executionId: string
  workflowId: string
  variables: Record<string, unknown>
  stepResults: Record<string, unknown>
}

export interface StepConfig {
  id: string
  name: string
  type: StepType
  config: Record<string, unknown>
  timeout?: number
  retries?: number
  conditions?: Record<string, unknown>
}

export interface ExecutionResult {
  success: boolean
  result?: unknown
  error?: string
  logs?: string[]
}

export class WorkflowEngine {
  private logger: Logger

  constructor() {
    this.logger = new Logger('WorkflowEngine')
  }

  /**
   * Execute a workflow by ID
   */
  async executeWorkflow(
    workflowId: string,
    triggerData?: Record<string, unknown>,
    triggeredBy?: string,
  ): Promise<string> {
    this.logger.info(`Starting workflow execution`, { workflowId, triggeredBy })

    try {
      // Get workflow with steps
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      })

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
      }

      if (!workflow.isActive) {
        throw new Error(`Workflow is not active: ${workflowId}`)
      }

      // Create execution record
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId,
          status: ExecutionStatus.RUNNING,
          startedAt: new Date(),
          triggeredBy,
          triggerData: (triggerData || {}) as Prisma.InputJsonValue,
          stepResults: {} as Prisma.InputJsonValue,
        },
      })

      // Execute workflow asynchronously
      this.runWorkflowExecution(execution.id, workflow.steps).catch((error) => {
        this.logger.error(`Workflow execution failed`, { executionId: execution.id, error })
      })

      return execution.id
    } catch (error) {
      this.logger.error(`Failed to start workflow execution`, { workflowId, error })
      throw error
    }
  }

  /**
   * Run workflow execution with all steps
   */
  private async runWorkflowExecution(executionId: string, steps: WorkflowStep[]) {
    const context: WorkflowContext = {
      executionId,
      workflowId: '',
      variables: {},
      stepResults: {},
    }

    try {
      this.logger.info(`Running workflow execution`, { executionId, stepCount: steps.length })

      // Execute steps in order
      for (const step of steps) {
        await this.executeStep(context, step)

        // Check if execution was cancelled
        const execution = await prisma.workflowExecution.findUnique({
          where: { id: executionId },
        })

        if (execution?.status === ExecutionStatus.CANCELLED) {
          this.logger.info(`Workflow execution cancelled`, { executionId })
          return
        }
      }

      // Mark execution as successful
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.SUCCESS,
          finishedAt: new Date(),
          stepResults: context.stepResults as Prisma.InputJsonValue,
        },
      })

      this.logger.info(`Workflow execution completed successfully`, { executionId })
    } catch (error) {
      // Mark execution as failed
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.FAILED,
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
          stepResults: context.stepResults as Prisma.InputJsonValue,
        },
      })

      this.logger.error(`Workflow execution failed`, { executionId, error })
      throw error
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    context: WorkflowContext,
    step: WorkflowStep,
  ): Promise<ExecutionResult> {
    const stepId = step.id
    const maxAttempts = step.retries || 3
    let lastError: Error | null = null

    this.logger.info(`Executing step`, { stepId, type: step.type, attempt: 1 })

    // Create step execution record
    const stepExecution = await prisma.stepExecution.create({
      data: {
        executionId: context.executionId,
        stepId,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
        maxAttempts,
        attemptNumber: 1,
      },
    })

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Update attempt number
        await prisma.stepExecution.update({
          where: { id: stepExecution.id },
          data: { attemptNumber: attempt },
        })

        // Check step conditions
        if (step.conditions && !this.evaluateConditions(step.conditions as Record<string, unknown>, context)) {
          this.logger.info(`Step skipped due to conditions`, { stepId })

          await prisma.stepExecution.update({
            where: { id: stepExecution.id },
            data: {
              status: ExecutionStatus.SUCCESS,
              finishedAt: new Date(),
              logs: 'Step skipped due to conditions',
            },
          })

          return { success: true, logs: ['Step skipped due to conditions'] }
        }

        // Execute step based on type
        const result = await this.runStepProcessor(step, context)

        // Update step execution with success
        await prisma.stepExecution.update({
          where: { id: stepExecution.id },
          data: {
            status: ExecutionStatus.SUCCESS,
            finishedAt: new Date(),
            output: result.result || {},
            logs: result.logs?.join('\n') || null,
          },
        })

        // Store result in context
        context.stepResults[stepId] = result.result

        this.logger.info(`Step executed successfully`, { stepId, attempt })
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        this.logger.warn(`Step execution failed`, { stepId, attempt, error: lastError.message })

        if (attempt === maxAttempts) {
          // Final failure
          await prisma.stepExecution.update({
            where: { id: stepExecution.id },
            data: {
              status: ExecutionStatus.FAILED,
              finishedAt: new Date(),
              error: lastError.message,
              logs: `Failed after ${maxAttempts} attempts`,
            },
          })

          throw lastError
        } else {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Step execution failed')
  }

  /**
   * Run step processor based on step type
   */
  private async runStepProcessor(
    step: WorkflowStep,
    context: WorkflowContext,
  ): Promise<ExecutionResult> {
    const { type, config } = step

    switch (type) {
      case StepType.API_CALL:
        return await this.executeApiCall(config as Record<string, unknown>, context)

      case StepType.DELAY:
        return await this.executeDelay(config as Record<string, unknown>, context)

      case StepType.TRANSFORM:
        return await this.executeTransform(config as Record<string, unknown>, context)

      case StepType.WEBHOOK:
        return await this.executeWebhook(config as Record<string, unknown>, context)

      case StepType.EMAIL:
        return await this.executeEmail(config as Record<string, unknown>, context)

      case StepType.CONDITIONAL:
        return await this.executeConditional(config as Record<string, unknown>, context)

      case StepType.CUSTOM:
        return await this.executeCustom(config as Record<string, unknown>, context)

      default:
        throw new Error(`Unsupported step type: ${type}`)
    }
  }

  /**
   * Execute API call step
   */
  private async executeApiCall(
    config: Record<string, unknown>,
    _context: WorkflowContext,
  ): Promise<ExecutionResult> {
    const { url, method = 'GET', headers = {}, body } = config

    try {
      const response = await fetch(url as string, {
        method: method as string,
        headers: {
          'Content-Type': 'application/json',
          ...(headers as Record<string, string>),
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const result = await response.json()

      return {
        success: response.ok,
        result: {
          status: response.status,
          data: result,
        },
        logs: [`API call to ${url} completed with status ${response.status}`],
      }
    } catch (error) {
      throw new Error(`API call failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Execute delay step
   */
  private async executeDelay(
    config: Record<string, unknown>,
    _context: WorkflowContext,
  ): Promise<ExecutionResult> {
    const { duration = 1000 } = config

    await new Promise((resolve) => setTimeout(resolve, duration as number))

    return {
      success: true,
      result: { delayed: duration },
      logs: [`Delayed execution for ${duration}ms`],
    }
  }

  /**
   * Execute transform step
   */
  private async executeTransform(
    config: Record<string, unknown>,
    context: WorkflowContext,
  ): Promise<ExecutionResult> {
    const { source, transformations = [] } = config

    let data = context.stepResults[source as string] || {}

    for (const transform of (transformations as any[])) {
      // Apply transformation logic here
      // This is a simplified version - in production you'd want a more robust transformer
      if (transform.type === 'map') {
        data = transform.mapping ? this.applyMapping(data as Record<string, unknown>, transform.mapping) : data
      }
    }

    return {
      success: true,
      result: data,
      logs: [`Transformed data from step ${source}`],
    }
  }

  /**
   * Execute webhook step
   */
  private async executeWebhook(
    config: Record<string, unknown>,
    context: WorkflowContext,
  ): Promise<ExecutionResult> {
    return await this.executeApiCall(config, context)
  }

  /**
   * Execute email step (placeholder)
   */
  private async executeEmail(
    config: Record<string, unknown>,
    _context: WorkflowContext,
  ): Promise<ExecutionResult> {
    const { to, subject } = config

    // In a real implementation, you would integrate with an email service
    this.logger.info(`Email step executed`, { to, subject })

    return {
      success: true,
      result: { sent: true, to, subject },
      logs: [`Email sent to ${to}`],
    }
  }

  /**
   * Execute conditional step
   */
  private async executeConditional(
    config: Record<string, unknown>,
    context: WorkflowContext,
  ): Promise<ExecutionResult> {
    const { condition } = config

    const conditionResult = this.evaluateConditions(condition as Record<string, unknown>, context)

    return {
      success: true,
      result: { condition: conditionResult, executed: conditionResult ? 'true' : 'false' },
      logs: [`Condition evaluated to ${conditionResult}`],
    }
  }

  /**
   * Execute custom step (placeholder)
   */
  private async executeCustom(
    config: Record<string, unknown>,
    _context: WorkflowContext,
  ): Promise<ExecutionResult> {
    const { inputs } = config

    // In a real implementation, you might execute sandboxed code
    this.logger.info(`Custom step executed`, { inputs })

    return {
      success: true,
      result: { executed: true, inputs },
      logs: [`Custom step executed`],
    }
  }

  /**
   * Evaluate step conditions
   */
  private evaluateConditions(
    conditions: Record<string, unknown>,
    context: WorkflowContext,
  ): boolean {
    if (!conditions) return true

    // Simple condition evaluation - in production you'd want a more robust evaluator
    const { field, operator, value } = conditions
    const fieldValue = context.stepResults[field as string]

    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'not_equals':
        return fieldValue !== value
      case 'greater_than':
        return Number(fieldValue) > Number(value)
      case 'less_than':
        return Number(fieldValue) < Number(value)
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null
      default:
        return true
    }
  }

  /**
   * Apply data mapping
   */
  private applyMapping(
    data: Record<string, unknown>,
    mapping: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, sourcePath] of Object.entries(mapping)) {
      // Simple path resolution - in production you'd want something more robust
      result[key] = this.getValueByPath(data, sourcePath as string)
    }

    return result
  }

  /**
   * Get value by dot notation path
   */
  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: any, key) => current?.[key], obj as any)
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string, reason?: string): Promise<void> {
    this.logger.info(`Cancelling workflow execution`, { executionId, reason })

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.CANCELLED,
        finishedAt: new Date(),
        error: reason || 'Execution cancelled by user',
      },
    })
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId: string, stepId?: string): Promise<unknown[]> {
    if (stepId) {
      const stepExecution = await prisma.stepExecution.findFirst({
        where: {
          executionId,
          stepId,
        },
      })

      return stepExecution?.logs ? [stepExecution.logs] : []
    }

    const stepExecutions = await prisma.stepExecution.findMany({
      where: { executionId },
      orderBy: { createdAt: 'asc' },
    })

    return stepExecutions.map((se) => ({
      stepId: se.stepId,
      logs: se.logs,
      status: se.status,
      error: se.error,
    }))
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine()
