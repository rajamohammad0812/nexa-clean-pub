import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ProjectAnalysis } from '@/types/ai-analysis'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    // Build filter conditions
    const where: { userId: string; status?: 'GENERATING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' } = { userId: user.id }
    if (status && ['GENERATING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(status)) {
      where.status = status as 'GENERATING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
    }

    // Fetch AI projects
    const aiProjects = await prisma.aIProject.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        description: true,
        projectType: true,
        complexity: true,
        confidence: true,
        userPrompt: true,
        keyFeatures: true,
        techStack: true,
        estimatedWeeks: true,
        templateId: true,
        templateName: true,
        status: true,
        projectPath: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.aIProject.count({ where })

    return NextResponse.json({
      success: true,
      aiProjects,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error fetching AI projects:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      description,
      projectAnalysis,
      userPrompt,
      templateId,
      templateName,
      confidence
    }: {
      name: string
      description?: string
      projectAnalysis: ProjectAnalysis
      userPrompt: string
      templateId: string
      templateName: string
      confidence?: number
    } = body

    // Validate required fields
    if (!name || !projectAnalysis || !userPrompt || !templateId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create AI project record
    const aiProject = await prisma.aIProject.create({
      data: {
        name,
        description,
        projectType: projectAnalysis.projectType,
        complexity: projectAnalysis.complexity,
        confidence: confidence || 0.5,
        userPrompt,
        keyFeatures: JSON.parse(JSON.stringify(projectAnalysis.keyFeatures)),
        techStack: JSON.parse(JSON.stringify(projectAnalysis.techStack)),
        estimatedWeeks: projectAnalysis.estimatedTimeWeeks,
        templateId,
        templateName,
        status: 'GENERATING',
        userId: user.id,
      }
    })

    return NextResponse.json({
      success: true,
      aiProject: {
        id: aiProject.id,
        name: aiProject.name,
        description: aiProject.description,
        projectType: aiProject.projectType,
        status: aiProject.status,
        createdAt: aiProject.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating AI project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create AI project' },
      { status: 500 }
    )
  }
}