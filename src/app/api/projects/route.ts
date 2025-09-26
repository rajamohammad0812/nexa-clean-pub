import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateProjectFiles } from '@/lib/project-generator'

// Schema for project creation/update
const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  repository: z.union([z.string().url(), z.literal('')]).optional(),
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
  config: z.record(z.string(), z.any()).optional(),
  customPath: z.string().optional(), // Allow custom project generation path
})

// GET /api/projects - List all projects for the authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // If no session, try to use development user
    let userId = session?.user?.id
    
    if (!userId) {
      // For development: find or create a default user
      try {
        const defaultUser = await prisma.user.upsert({
          where: { email: 'dev@nexa.com' },
          create: {
            email: 'dev@nexa.com',
            name: 'Development User',
          },
          update: {}
        })
        userId = defaultUser.id
        console.log('Using development user for GET projects:', defaultUser.id)
      } catch (dbError) {
        console.error('Failed to create development user:', dbError)
        return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
      }
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: userId,
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

    // If no session, try to create a development user
    let userId = session?.user?.id
    
    if (!userId) {
      // For development: create a default user
      try {
        const defaultUser = await prisma.user.upsert({
          where: { email: 'dev@nexa.com' },
          create: {
            email: 'dev@nexa.com',
            name: 'Development User',
          },
          update: {}
        })
        userId = defaultUser.id
        console.log('Created/found development user:', defaultUser.id)
      } catch (dbError) {
        console.error('Failed to create development user:', dbError)
        return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
      }
    }

    const body = await request.json()
    console.log('Request body received:', JSON.stringify(body, null, 2))

    // Validate input
    console.log('About to validate with schema...')
    console.log('ProjectSchema type:', typeof ProjectSchema)
    console.log('ProjectSchema parse method:', typeof ProjectSchema.parse)
    
    let validatedData
    try {
      validatedData = ProjectSchema.parse(body)
      console.log('Validation successful:', JSON.stringify(validatedData, null, 2))
    } catch (zodError) {
      console.error('Zod parse failed, falling back to manual validation:', zodError)
      // Manual validation fallback
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json(
          { error: 'Project name is required and must be a string' },
          { status: 400 }
        )
      }
      if (!body.framework || !['NEXTJS', 'REACT', 'VUE', 'ANGULAR', 'SVELTE', 'NODEJS', 'PYTHON', 'GOLANG', 'RUST', 'DOCKER'].includes(body.framework)) {
        return NextResponse.json(
          { error: 'Valid framework is required' },
          { status: 400 }
        )
      }
      
      validatedData = {
        name: body.name,
        description: body.description || null,
        repository: body.repository || null,
        framework: body.framework,
        config: body.config || null,
      }
      console.log('Manual validation successful:', JSON.stringify(validatedData, null, 2))
    }

    // Extract customPath before database operation
    const { customPath, ...projectData } = validatedData

    // Create project with default environments
    const project = await prisma.project.create({
      data: {
        ...projectData,
        userId: userId,
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

    // Generate project files
    console.log('Generating project files...')
    if (customPath) {
      console.log('Using custom project path:', customPath)
    }
    
    try {
      const projectPath = await generateProjectFiles(
        project.id,
        projectData.name,
        projectData.description || 'Generated project',
        'nextjs-fullstack', // Default template
        undefined, // ProjectAnalysis - could be passed from config
        projectData.config?.features || [], // Features from AI analysis
        customPath // Custom path for project generation
      )
      console.log('Project files generated at:', projectPath)
    } catch (fileError) {
      console.error('Error generating project files:', fileError)
      // Don't fail the API call if file generation fails
      // The database record is still created successfully
    }

    return NextResponse.json(
      {
        success: true,
        project,
        message: 'Project created successfully with generated files',
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
