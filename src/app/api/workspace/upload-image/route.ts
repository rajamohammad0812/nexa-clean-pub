import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { writeFile } from 'fs/promises'

const WORKSPACE_ROOT = path.join(process.cwd(), 'generated-projects', 'workspace')
const IMAGES_DIR = path.join(process.cwd(), 'public', 'project-images')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const projectName = formData.get('projectName') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // Ensure images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${projectName}-${Date.now()}.${ext}`
    const filepath = path.join(IMAGES_DIR, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return public URL
    const imageUrl = `/project-images/${filename}`

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}
