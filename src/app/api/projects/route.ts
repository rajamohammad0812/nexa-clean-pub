import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for project creation/update
const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  repository: z.string().url().optional().or(z.literal('')),
  framework: z.enum([
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
  ]),
  config: z.record(z.any()).optional(),
})

// GET /api/projects - List all projects for the authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        environments: {
          select: {
            id: true,
            name: true,
            type: true,
            cloudProvider: true,
          },
        },
        workflows: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true,
          },
        },
        deployments: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Last 5 deployments
        },
        _count: {
          select: {
            workflows: true,
            deployments: true,
            environments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      projects,
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = ProjectSchema.parse(body)

    // Create project with default environments
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        environments: {
          create: [
            {
              name: 'development',
              type: 'DEVELOPMENT',
              cloudProvider: 'VERCEL', // Default provider
            },
            {
              name: 'production',
              type: 'PRODUCTION',
              cloudProvider: 'VERCEL',
            },
          ],
        },
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

    return NextResponse.json(
      {
        success: true,
        project,
        message: 'Project created successfully',
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
