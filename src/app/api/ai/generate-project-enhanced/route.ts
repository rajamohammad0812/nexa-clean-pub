import { NextRequest, NextResponse } from 'next/server'
import { AICodeGenerator, GeneratedCode } from '@/lib/ai/code-generator'
import { ProjectAnalysis } from '@/types/ai-analysis'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs-extra'

interface EnhancedGenerateRequest {
  projectAnalysis: ProjectAnalysis
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

    const body: EnhancedGenerateRequest = await request.json()

    // Validate input
    if (!body.projectAnalysis || !body.projectName) {
      return NextResponse.json(
        { error: 'Project analysis and project name are required' },
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

    const { projectAnalysis, projectName } = body

    console.log(`Starting enhanced project generation for: ${projectName}`)

    // Step 1: Generate base project using existing CLI
    const baseProjectResult = await generateBaseProject(projectName, projectAnalysis)
    
    if (!baseProjectResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate base project',
        details: baseProjectResult.error
      }, { status: 500 })
    }

    // Step 2: Generate custom code using AI
    const generatedFiles = await generateCustomCode(projectAnalysis)

    // Step 3: Write generated files to project
    const enhancementResult = await enhanceProjectWithAI(
      baseProjectResult.projectPath!, 
      generatedFiles
    )

    return NextResponse.json({
      success: true,
      projectName,
      projectPath: baseProjectResult.projectPath,
      baseProject: baseProjectResult,
      generatedFiles: generatedFiles.map(f => ({
        filename: f.filename,
        description: f.description,
        type: f.type
      })),
      enhancement: enhancementResult,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Enhanced project generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate enhanced project. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate base project using existing CLI system
 */
async function generateBaseProject(
  projectName: string,
  projectAnalysis: ProjectAnalysis
): Promise<{
  success: boolean
  output?: string
  error?: string
  projectPath?: string
}> {
  return new Promise((resolve) => {
    try {
      const cliPath = path.resolve(process.cwd(), 'packages/cli/dist/index.js')
      const tempDir = path.resolve(process.cwd(), 'temp-projects')
      
      // Ensure temp directory exists
      fs.ensureDirSync(tempDir)

      const cliArgs = [
        cliPath,
        'create',
        projectName,
        '--template',
        projectAnalysis.recommendedTemplate?.id || 'nextjs-fullstack',
        '--description',
        `${projectAnalysis.description}. Features: ${projectAnalysis.keyFeatures.map(f => f.name).join(', ')}`,
        '--no-install',
        '--no-git'
      ]

      console.log('Executing CLI:', 'node', cliArgs.join(' '))

      const cliProcess = spawn('node', cliArgs, {
        cwd: tempDir,
        stdio: 'pipe'
      })

      let output = ''
      let errorOutput = ''

      cliProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      cliProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

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

      cliProcess.on('error', (error) => {
        console.error('CLI spawn error:', error)
        resolve({
          success: false,
          error: `Failed to start CLI process: ${error.message}`
        })
      })

      // 60 second timeout
      setTimeout(() => {
        if (!cliProcess.killed) {
          cliProcess.kill()
          resolve({
            success: false,
            error: 'CLI process timed out after 60 seconds'
          })
        }
      }, 60000)

    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown CLI error'
      })
    }
  })
}

/**
 * Generate custom code using AI for each feature
 */
async function generateCustomCode(projectAnalysis: ProjectAnalysis): Promise<GeneratedCode[]> {
  const allFiles: GeneratedCode[] = []

  console.log('Generating AI-powered custom code...')

  try {
    // Generate database schema
    console.log('Generating database schema...')
    const schema = await AICodeGenerator.generateDatabaseSchema(projectAnalysis)
    allFiles.push(schema)

    // Generate code for each key feature
    for (const feature of projectAnalysis.keyFeatures.slice(0, 5)) { // Limit to top 5 features
      console.log(`Generating code for feature: ${feature.name}`)
      
      try {
        const featureFiles = await AICodeGenerator.generateFeatureFiles(
          projectAnalysis, 
          feature.name
        )
        allFiles.push(...featureFiles)
      } catch (error) {
        console.warn(`Failed to generate code for feature ${feature.name}:`, error)
        // Continue with other features
      }
    }

    console.log(`Generated ${allFiles.length} AI-powered files`)
    return allFiles

  } catch (error) {
    console.error('Error in generateCustomCode:', error)
    throw error
  }
}

/**
 * Write AI-generated files to the project directory
 */
async function enhanceProjectWithAI(
  projectPath: string,
  generatedFiles: GeneratedCode[]
): Promise<{
  success: boolean
  filesWritten: number
  errors: string[]
}> {
  const errors: string[] = []
  let filesWritten = 0

  console.log(`Enhancing project at ${projectPath} with ${generatedFiles.length} AI-generated files`)

  for (const file of generatedFiles) {
    try {
      let targetPath: string

      // Determine target path based on file type
      switch (file.type) {
        case 'schema':
          targetPath = path.join(projectPath, 'prisma', file.filename)
          break
        case 'component':
          targetPath = path.join(projectPath, 'src', 'components', file.filename)
          break
        case 'api':
          targetPath = path.join(projectPath, 'src', 'app', 'api', file.filename)
          break
        case 'page':
          targetPath = path.join(projectPath, 'src', 'app', file.filename)
          break
        default:
          targetPath = path.join(projectPath, 'src', file.filename)
      }

      // Ensure directory exists
      await fs.ensureDir(path.dirname(targetPath))

      // Write the file
      await fs.writeFile(targetPath, file.content, 'utf8')
      
      console.log(`✅ Written: ${file.filename} (${file.type})`)
      filesWritten++

    } catch (error) {
      const errorMsg = `Failed to write ${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(`❌ ${errorMsg}`)
      errors.push(errorMsg)
    }
  }

  return {
    success: errors.length === 0,
    filesWritten,
    errors
  }
}