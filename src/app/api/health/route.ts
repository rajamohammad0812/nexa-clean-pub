import { NextResponse } from 'next/server'
import { serverLogger } from '@/lib/logger'

export async function GET() {
  serverLogger.info('Health check')
  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}
