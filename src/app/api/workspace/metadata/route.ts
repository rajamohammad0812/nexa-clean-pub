import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const WORKSPACE_ROOT = path.join(process.cwd(), 'generated-projects', 'workspace')
const METADATA_FILE = path.join(WORKSPACE_ROOT, '.projects-metadata.json')

interface ProjectMetadata {
  name: string
  displayName: string
  description: string
  createdAt: string
  techStack: string[]
  imageUrl?: string
}

interface MetadataStore {
  projects: Record<string, ProjectMetadata>
}

export async function GET() {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      return NextResponse.json({ projects: {} })
    }

    const data = fs.readFileSync(METADATA_FILE, 'utf-8')
    const metadata: MetadataStore = JSON.parse(data)

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error reading metadata:', error)
    return NextResponse.json({ projects: {} })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectName, displayName, description, techStack, imageUrl } = body

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    let metadata: MetadataStore = { projects: {} }
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf-8')
      metadata = JSON.parse(data)
    }

    metadata.projects[projectName] = {
      name: projectName,
      displayName: displayName || projectName,
      description: description || '',
      createdAt: new Date().toISOString(),
      techStack: techStack || [],
      imageUrl: imageUrl || '',
    }

    if (!fs.existsSync(WORKSPACE_ROOT)) {
      fs.mkdirSync(WORKSPACE_ROOT, { recursive: true })
    }

    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))

    return NextResponse.json({ success: true, metadata: metadata.projects[projectName] })
  } catch (error) {
    console.error('Error saving metadata:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save metadata' },
      { status: 500 }
    )
  }
}
