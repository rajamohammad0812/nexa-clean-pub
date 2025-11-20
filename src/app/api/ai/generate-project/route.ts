import { NextRequest, NextResponse } from 'next/server'
import { ProjectGeneratorAI, ProjectRequirements } from '@/lib/ai/project-generator'
import { SingleBuildExecutor, BuildExecutorOptions } from '@/lib/build-executor'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface GenerateProjectRequest {
  requirements: ProjectRequirements
  projectName: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.',
          suggestion: 'Get your API key from https://console.anthropic.com/'
        },
        { status: 500 }
      )
    }

    // Get user session and userId
    const session = await getServerSession(authOptions)
    let userId: string | undefined
    
    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true }
        })
        userId = user?.id
      } catch (error) {
        console.error('Error fetching user:', error)
        // Continue without userId - project will still be generated
      }
    }

    const body: GenerateProjectRequest = await request.json()

    // Validate input
    if (!body.requirements || !body.projectName) {
      return NextResponse.json(
        { error: 'Requirements and project name are required' },
        { status: 400 }
      )
    }

    // Validate project name
    if (!/^[a-zA-Z0-9-_]+$/.test(body.projectName)) {
      return NextResponse.json(
        { error: 'Project name can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      )
    }

    // Generate detailed project plan using AI (optional, for documentation)
    const projectPlan = await ProjectGeneratorAI.generateProjectPlan(body.requirements)

    // Execute build using Single Build Executor with agent-based generation
    const executor = new SingleBuildExecutor()
    
    const buildOptions: BuildExecutorOptions = {
      projectName: body.projectName,
      requirements: body.requirements,
      userId,
      maxIterations: 30,
    }

    const buildResult = await executor.execute(buildOptions)

    return NextResponse.json({
      success: buildResult.success,
      projectName: body.projectName,
      projectId: buildResult.projectId,
      projectPath: buildResult.projectPath,
      aiProjectId: buildResult.aiProjectId,
      requirements: body.requirements,
      projectPlan,
      progress: buildResult.progress,
      agentSteps: buildResult.agentResult.steps.length,
      error: buildResult.error,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Project generation error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'Invalid Anthropic API key. Please check your API key configuration.',
            suggestion: 'Verify your ANTHROPIC_API_KEY environment variable is correct.'
          },
          { status: 401 }
        )
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please try again in a moment.',
            suggestion: 'You can upgrade your Anthropic plan for higher rate limits.'
          },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate project. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Analyze a user message to determine if it's a project request
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const message = searchParams.get('message')

    if (!message) {
      return NextResponse.json(
        { error: 'Message parameter is required' },
        { status: 400 }
      )
    }

    // Analyze the message
    const analysis = await ProjectGeneratorAI.analyzeProjectRequest(message)

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Project analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze message. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}