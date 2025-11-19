import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploadedFiles = []

    for (const file of files) {
      try {
        // Read file content
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Save file temporarily
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = path.join(uploadDir, fileName)
        await writeFile(filePath, buffer)

        // Extract content based on file type
        let content = ''
        const fileType = file.type || getFileTypeFromName(file.name)

        if (isTextFile(file.name, fileType)) {
          // For text files, extract content directly
          content = buffer.toString('utf-8')
        } else if (fileType.startsWith('image/')) {
          // For images, just note that it's an image
          content = `[Image file: ${file.name}. Use this as a visual reference for UI design.]`
        } else if (fileType === 'application/pdf') {
          // For PDFs, note that it's a PDF (we can add PDF parsing later with pdf-parse package)
          content = `[PDF file: ${file.name}. Contains documentation or requirements.]`
        } else {
          // For other files, try to read as text
          try {
            content = buffer.toString('utf-8')
          } catch {
            content = `[Binary file: ${file.name}]`
          }
        }

        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: fileType,
          content: content,
          path: filePath,
        })
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getFileTypeFromName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.jsx': 'text/javascript',
    '.ts': 'text/typescript',
    '.tsx': 'text/typescript',
    '.py': 'text/x-python',
    '.java': 'text/x-java',
    '.c': 'text/x-c',
    '.cpp': 'text/x-c++',
    '.html': 'text/html',
    '.css': 'text/css',
    '.xml': 'application/xml',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.csv': 'text/csv',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

function isTextFile(fileName: string, fileType: string): boolean {
  const textExtensions = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', 
                         '.py', '.java', '.c', '.cpp', '.html', '.css', '.xml', 
                         '.yaml', '.yml', '.csv']
  const ext = path.extname(fileName).toLowerCase()
  return textExtensions.includes(ext) || fileType.startsWith('text/')
}
