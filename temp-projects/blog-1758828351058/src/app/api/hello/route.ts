import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Hello from Blog1758828351058 API!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    framework: 'Next.js 14',
    features: [
      'TypeScript',
      'Tailwind CSS',
      'NextAuth.js',
      'PostgreSQL'
    ]
  })
}

export async function POST(request: Request) {
  const data = await request.json()
  
  return NextResponse.json({
    message: 'Data received successfully',
    received: data,
    timestamp: new Date().toISOString()
  })
}