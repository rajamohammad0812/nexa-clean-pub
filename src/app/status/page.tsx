import pkg from '../../../package.json'
import { ENV } from '@/lib/env'

async function getHealth() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/health`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Health failed')
    return (await res.json()) as { ok: boolean; ts: string }
  } catch (e) {
    return { ok: false, ts: new Date().toISOString() }
  }
}

export default async function StatusPage() {
  const health = await getHealth()
  const publicEnv = Object.fromEntries(
    Object.entries(ENV.client).filter(([k]) => k.startsWith('NEXT_PUBLIC_')),
  )
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 prose dark:prose-invert">
      <h1>Status</h1>
      <ul>
        <li>Version: {pkg.version}</li>
        <li>Node env: {process.env.NODE_ENV}</li>
        <li>Health: {health.ok ? 'OK' : 'DOWN'} at {health.ts}</li>
      </ul>
      <h2>Public env</h2>
      <pre>{JSON.stringify(publicEnv, null, 2)}</pre>
    </div>
  )
}
