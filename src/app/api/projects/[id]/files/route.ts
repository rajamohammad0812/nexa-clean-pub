import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getProjectFileTree } from '@/lib/project-generator'

// GET /api/projects/[id]/files - Get project file tree
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const projectId = params.id

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

    // Get file tree
    const fileTree = await getProjectFileTree(projectId)
    
    if (!fileTree) {
      return NextResponse.json(
        { error: 'Project files not found - may not have been generated yet' }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      projectId,
      projectName: project.name,
      fileTree,
    })
  } catch (error) {
    console.error('Error fetching project files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project files' },
      { status: 500 }
    )
  }
}