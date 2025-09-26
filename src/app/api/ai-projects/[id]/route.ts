import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const aiProject = await prisma.aIProject.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!aiProject) {
      return NextResponse.json({ success: false, error: 'AI project not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      aiProject
    })

  } catch (error) {
    console.error('Error fetching AI project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI project' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      status,
      projectPath,
      generatedFiles,
      generationLogs,
      errorMessage
    } = body

    // Update the AI project
    const updatedProject = await prisma.aIProject.update({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
        ...(status && { status }),
        ...(projectPath && { projectPath }),
        ...(generatedFiles && { generatedFiles }),
        ...(generationLogs && { generationLogs }),
        ...(errorMessage && { errorMessage }),
        ...(status === 'SUCCESS' && { completedAt: new Date() }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      aiProject: updatedProject
    })

  } catch (error) {
    console.error('Error updating AI project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update AI project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Delete the AI project
    await prisma.aIProject.delete({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'AI project deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting AI project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete AI project' },
      { status: 500 }
    )
  }
}