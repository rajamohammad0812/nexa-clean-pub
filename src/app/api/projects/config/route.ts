import { NextRequest, NextResponse } from 'next/server'
import { getProjectConfig, getSuggestedProjectLocations, validateProjectPath } from '@/lib/project-config'

// GET /api/projects/config - Get project generation configuration and suggested paths
export async function GET(request: NextRequest) {
  try {
    const config = getProjectConfig()
    const suggestedLocations = getSuggestedProjectLocations()

    return NextResponse.json({
      success: true,
      config: {
        baseDirectory: config.baseDirectory,
        allowCustomPath: config.allowCustomPath,
        defaultProjectsPath: config.defaultProjectsPath,
      },
      suggestedLocations,
    })
  } catch (error) {
    console.error('Error fetching project config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project configuration' },
      { status: 500 }
    )
  }
}

// POST /api/projects/config/validate - Validate a custom project path
export async function POST(request: NextRequest) {
  try {
    const { path: projectPath } = await request.json()
    
    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      )
    }

    const validation = validateProjectPath(projectPath)
    
    return NextResponse.json({
      success: true,
      validation,
    })
  } catch (error) {
    console.error('Error validating project path:', error)
    return NextResponse.json(
      { error: 'Failed to validate project path' },
      { status: 500 }
    )
  }
}