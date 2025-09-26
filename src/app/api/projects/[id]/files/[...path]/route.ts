import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getProjectFile } from '@/lib/project-generator'

// GET /api/projects/[id]/files/[...path] - Get specific file content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions)
    const projectId = params.id
    const filePath = params.path.join('/')

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        // For development, allow access without session
        // In production, you'd want: userId: session?.user?.id
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get file content
    const content = await getProjectFile(projectId, filePath)
    
    if (content === null) {
      return NextResponse.json(
        { error: 'File not found' }, 
        { status: 404 }
      )
    }

    // Determine content type based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    const contentType = getContentType(extension || '')

    return NextResponse.json({
      success: true,
      projectId,
      filePath,
      content,
      contentType,
      projectName: project.name,
    })
  } catch (error) {
    console.error('Error fetching project file:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project file' },
      { status: 500 }
    )
  }
}

function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'css': 'css',
    'html': 'html',
    'md': 'markdown',
    'txt': 'text',
    'yml': 'yaml',
    'yaml': 'yaml',
  }
  return contentTypes[extension] || 'text'
}