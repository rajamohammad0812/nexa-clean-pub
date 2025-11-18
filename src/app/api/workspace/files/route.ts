import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const WORKSPACE_ROOT = path.join(process.cwd(), 'generated-projects', 'workspace')

function getFilesRecursively(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  
  if (!fs.existsSync(dir)) {
    return files
  }

  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    if (item.startsWith('.')) {
      continue
    }

    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      if (item === 'node_modules' || item === '.git') {
        continue
      }
      files.push(...getFilesRecursively(fullPath, baseDir))
    } else {
      const relativePath = path.relative(baseDir, fullPath)
      files.push(relativePath)
    }
  }
  
  return files
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectName = searchParams.get('project')

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const projectPath = path.join(WORKSPACE_ROOT, projectName)

    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ files: [] })
    }

    const files = getFilesRecursively(projectPath)

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error listing files:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { project, file } = await request.json()

    if (!project || !file) {
      return NextResponse.json(
        { error: 'Project and file path are required' },
        { status: 400 }
      )
    }

    const filePath = path.join(WORKSPACE_ROOT, project, file)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const content = fs.readFileSync(filePath, 'utf-8')

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read file' },
      { status: 500 }
    )
  }
}
