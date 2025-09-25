import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  repository: z.string().url().optional().or(z.literal('')),
  framework: z
    .enum([
      'NEXTJS',
      'REACT',
      'VUE',
      'ANGULAR',
      'SVELTE',
      'NODEJS',
      'PYTHON',
      'GOLANG',
      'RUST',
      'DOCKER',
    ])
    .optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/projects/[id] - Get a specific project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        environments: {
          include: {
            deployments: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            _count: {
              select: {
                deployments: true,
              },
            },
          },
        },
        workflows: {
          include: {
            executions: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            _count: {
              select: {
                steps: true,
                executions: true,
              },
            },
          },
        },
        deployments: {
          include: {
            environment: {
              select: {
                name: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            workflows: true,
            deployments: true,
            environments: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      project,
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateProjectSchema.parse(body)

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: params.id,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        repository: validatedData.repository,
        framework: validatedData.framework,
        status: validatedData.status,
      },
      include: {
        environments: true,
        _count: {
          select: {
            workflows: true,
            deployments: true,
            environments: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: 'Project updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
