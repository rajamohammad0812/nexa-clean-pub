import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const WORKSPACE_ROOT = path.join(process.cwd(), 'generated-projects', 'workspace')
const METADATA_FILE = path.join(WORKSPACE_ROOT, '.projects-metadata.json')

export async function POST(request: NextRequest) {
  try {
    const { project } = await request.json()

    if (!project) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const projectPath = path.join(WORKSPACE_ROOT, project)

    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true })
    }

    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf-8')
      const metadata = JSON.parse(data)
      
      if (metadata.projects && metadata.projects[project]) {
        delete metadata.projects[project]
        fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Project ${project} deleted successfully`,
    })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 }
    )
  }
}
