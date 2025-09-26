import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users - Create a user for development
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create or find user
    const user = await prisma.user.upsert({
      where: { email: body.email },
      create: {
        email: body.email,
        name: body.name || body.email.split('@')[0] || 'User',
        image: body.image || null,
      },
      update: {
        name: body.name || body.email.split('@')[0] || 'User',
        image: body.image || null,
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      }
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}