import { AgentExecutor, AgentExecutionResult, AgentStep } from './agent/executor'
import { ProjectRequirements, ProjectGeneratorAI } from './ai/project-generator'
import { prisma } from './prisma'
import { AIProjectStatus } from '@prisma/client'

export interface BuildExecutorOptions {
  projectName: string
  requirements: ProjectRequirements
  userId?: string
  maxIterations?: number
}

export interface BuildProgress {
  stage: 'analyzing' | 'creating_db_record' | 'generating_code' | 'finalizing' | 'completed' | 'failed'
  message: string
  percentage: number
  steps: AgentStep[]
  aiProjectId?: string
}

export interface BuildExecutorResult {
  success: boolean
  projectId: string
  projectPath: string
  aiProjectId?: string
  agentResult: AgentExecutionResult
  error?: string
  progress: BuildProgress[]
}

export class SingleBuildExecutor {
  private progressCallbacks: ((progress: BuildProgress) => void)[] = []
  private allProgress: BuildProgress[] = []

  /**
   * Register a callback to receive real-time progress updates
   */
  onProgress(callback: (progress: BuildProgress) => void) {
    this.progressCallbacks.push(callback)
  }

  /**
   * Emit progress update to all registered callbacks
   */
  private emitProgress(progress: BuildProgress) {
    this.allProgress.push(progress)
    this.progressCallbacks.forEach(callback => callback(progress))
  }

  /**
   * Execute the complete build process
   */
  async execute(options: BuildExecutorOptions): Promise<BuildExecutorResult> {
    const { projectName, requirements, userId, maxIterations = 30 } = options

    // Generate unique project ID
    const projectId = `${Date.now()}-${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    let aiProjectRecord: any = null

    try {
      // Stage 1: Analyze requirements
      this.emitProgress({
        stage: 'analyzing',
        message: 'Analyzing project requirements...',
        percentage: 10,
        steps: [],
      })

      // Validate requirements
      if (!requirements.isProjectRequest) {
        throw new Error('Not a valid project request')
      }

      // Stage 2: Create database record
      this.emitProgress({
        stage: 'creating_db_record',
        message: 'Creating project record in database...',
        percentage: 20,
        steps: [],
      })

      if (userId) {
        try {
          aiProjectRecord = await prisma.aIProject.create({
            data: {
              name: projectName,
              description: requirements.description,
              projectType: requirements.projectType,
              complexity: requirements.complexity,
              confidence: requirements.confidence / 100, // Convert percentage to decimal
              userPrompt: `Generate ${requirements.projectType}: ${requirements.description}`,
              keyFeatures: requirements.features || [],
              techStack: [requirements.suggestedTemplate],
              templateId: requirements.suggestedTemplate,
              templateName: requirements.suggestedTemplate,
              status: AIProjectStatus.GENERATING,
              userId: userId,
              projectPath: projectId,
            },
          })

          this.emitProgress({
            stage: 'creating_db_record',
            message: `Database record created: ${aiProjectRecord.id}`,
            percentage: 25,
            steps: [],
            aiProjectId: aiProjectRecord.id,
          })
        } catch (dbError) {
          console.error('Error creating AI project record:', dbError)
          // Continue without DB record
          this.emitProgress({
            stage: 'creating_db_record',
            message: 'Warning: Could not create database record, continuing...',
            percentage: 25,
            steps: [],
          })
        }
      }

      // Stage 3: Generate code using AI Agent
      this.emitProgress({
        stage: 'generating_code',
        message: 'Starting AI-driven code generation...',
        percentage: 30,
        steps: [],
        aiProjectId: aiProjectRecord?.id,
      })

      // Create agent executor
      const agent = new AgentExecutor(projectId, maxIterations)

      // Build comprehensive prompt for agent
      const agentPrompt = this.buildAgentPrompt(projectName, requirements)

      // Execute agent
      const agentResult = await agent.execute(agentPrompt)

      // Emit progress updates from agent steps
      let currentPercentage = 30
      const percentageIncrement = 60 / (agentResult.steps.length || 1)

      for (const step of agentResult.steps) {
        currentPercentage = Math.min(90, currentPercentage + percentageIncrement)

        this.emitProgress({
          stage: 'generating_code',
          message: `${step.type}: ${step.content.substring(0, 100)}`,
          percentage: Math.round(currentPercentage),
          steps: [step],
          aiProjectId: aiProjectRecord?.id,
        })
      }

      // Stage 4: Finalize
      if (agentResult.success) {
        this.emitProgress({
          stage: 'finalizing',
          message: 'Finalizing project...',
          percentage: 95,
          steps: [],
          aiProjectId: aiProjectRecord?.id,
        })

        // Update database record with success
        if (aiProjectRecord) {
          try {
            await prisma.aIProject.update({
              where: { id: aiProjectRecord.id },
              data: {
                status: AIProjectStatus.SUCCESS,
                completedAt: new Date(),
                generationLogs: this.formatStepsAsLog(agentResult.steps),
              },
            })
          } catch (updateError) {
            console.error('Error updating project record:', updateError)
          }
        }

        this.emitProgress({
          stage: 'completed',
          message: `Project '${projectName}' generated successfully!`,
          percentage: 100,
          steps: [],
          aiProjectId: aiProjectRecord?.id,
        })

        return {
          success: true,
          projectId,
          projectPath: `generated-projects/${projectId}`,
          aiProjectId: aiProjectRecord?.id,
          agentResult,
          progress: this.allProgress,
        }
      } else {
        throw new Error(agentResult.error || 'Agent execution failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update database with failure
      if (aiProjectRecord) {
        try {
          await prisma.aIProject.update({
            where: { id: aiProjectRecord.id },
            data: {
              status: AIProjectStatus.FAILED,
              errorMessage: errorMessage,
            },
          })
        } catch (updateError) {
          console.error('Error updating project record with failure:', updateError)
        }
      }

      this.emitProgress({
        stage: 'failed',
        message: `Build failed: ${errorMessage}`,
        percentage: 0,
        steps: [],
        aiProjectId: aiProjectRecord?.id,
      })

      return {
        success: false,
        projectId,
        projectPath: `generated-projects/${projectId}`,
        aiProjectId: aiProjectRecord?.id,
        agentResult: {
          success: false,
          response: errorMessage,
          steps: [],
          error: errorMessage,
        },
        error: errorMessage,
        progress: this.allProgress,
      }
    }
  }

  /**
   * Build comprehensive prompt for the AI agent
   */
  private buildAgentPrompt(projectName: string, requirements: ProjectRequirements): string {
    const featuresText = requirements.features.length > 0 
      ? `\n\nKey Features:\n${requirements.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
      : ''

    return `Create a production-ready ${requirements.projectType} application with the following specifications:

Project Name: ${projectName}
Description: ${requirements.description}
Complexity Level: ${requirements.complexity}
Template: ${requirements.suggestedTemplate}${featuresText}

Requirements:
1. Generate a complete, production-ready application
2. Include ALL necessary files (package.json, configs, TypeScript, components, etc.)
3. Follow modern best practices for ${requirements.suggestedTemplate}
4. Include proper error handling and validation
5. Add a comprehensive README.md with setup instructions
6. Ensure the code is clean, well-documented, and maintainable

Technical Stack:
- Framework: Next.js 14 with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- Database: PostgreSQL (with Prisma ORM if needed)
- Authentication: NextAuth.js (if user auth is required)

Start by creating the project structure, then generate all necessary files.
Make sure to include:
- package.json with all dependencies
- TypeScript configuration
- Tailwind CSS setup
- Environment variable templates
- Git configuration (.gitignore)
- Comprehensive README

Please proceed with creating the complete application now.`
  }

  /**
   * Format agent steps as a readable log
   */
  private formatStepsAsLog(steps: AgentStep[]): string {
    return steps
      .map(step => {
        const timestamp = step.timestamp.toISOString()
        const type = step.type.toUpperCase()
        return `[${timestamp}] ${type}: ${step.content}`
      })
      .join('\n')
  }

  /**
   * Get all progress updates
   */
  getProgress(): BuildProgress[] {
    return this.allProgress
  }
}

/**
 * Factory function for quick execution
 */
export async function executeBuild(options: BuildExecutorOptions): Promise<BuildExecutorResult> {
  const executor = new SingleBuildExecutor()
  return await executor.execute(options)
}
