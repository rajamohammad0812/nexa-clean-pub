import { NextRequest, NextResponse } from 'next/server'
import { ProjectGeneratorAI, ProjectRequirements } from '@/lib/ai/project-generator'
import { spawn } from 'child_process'
import path from 'path'

interface GenerateProjectRequest {
  requirements: ProjectRequirements
  projectName: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
          suggestion: 'Get your API key from https://platform.openai.com/api-keys'
        },
        { status: 500 }
      )
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

    // Generate detailed project plan using AI
    const projectPlan = await ProjectGeneratorAI.generateProjectPlan(body.requirements)

    // Call CLI to generate the project
    const cliResult = await generateProjectWithCLI(body.projectName, body.requirements)

    return NextResponse.json({
      success: true,
      projectName: body.projectName,
      requirements: body.requirements,
      projectPlan,
      cliResult,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Project generation error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'Invalid OpenAI API key. Please check your API key configuration.',
            suggestion: 'Verify your OPENAI_API_KEY environment variable is correct.'
          },
          { status: 401 }
        )
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please try again in a moment.',
            suggestion: 'You can upgrade your OpenAI plan for higher rate limits.'
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
 * Calls the CLI to generate a project based on requirements
 */
async function generateProjectWithCLI(
  projectName: string, 
  requirements: ProjectRequirements
): Promise<{
  success: boolean
  output?: string
  error?: string
  projectPath?: string
}> {
  return new Promise((resolve) => {
    try {
      // Path to our CLI
      const cliPath = path.resolve(process.cwd(), 'packages/cli/dist/index.js')
      
      // Temporary directory for generated projects (you can customize this)
      const tempDir = path.resolve(process.cwd(), 'temp-projects')
      
      // Build CLI command - using AI description generation
      const cliArgs = [
        cliPath,
        'create',
        projectName,
        '--description',
        `${requirements.description}. Features: ${requirements.features.join(', ')}`,
        '--no-install', // Don't install dependencies in temp directory
        '--no-git'      // Don't initialize git in temp directory
      ]

      console.log('Executing CLI:', 'node', cliArgs.join(' '))

      // Execute CLI
      const cliProcess = spawn('node', cliArgs, {
        cwd: tempDir,
        stdio: 'pipe'
      })

      let output = ''
      let errorOutput = ''

      // Capture output
      cliProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      cliProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

      // Handle completion
      cliProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            projectPath: path.join(tempDir, projectName)
          })
        } else {
          console.error('CLI error output:', errorOutput)
          resolve({
            success: false,
            error: errorOutput || `CLI process exited with code ${code}`,
            output: output
          })
        }
      })

      // Handle errors
      cliProcess.on('error', (error) => {
        console.error('CLI spawn error:', error)
        resolve({
          success: false,
          error: `Failed to start CLI process: ${error.message}`
        })
      })

      // Set timeout to prevent hanging
      setTimeout(() => {
        if (!cliProcess.killed) {
          cliProcess.kill()
          resolve({
            success: false,
            error: 'CLI process timed out after 60 seconds'
          })
        }
      }, 60000) // 60 second timeout

    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown CLI error'
      })
    }
  })
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