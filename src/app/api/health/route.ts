import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 *
 * Lightweight health check endpoint. Returns server status, DB connectivity,
 * memory usage, and uptime. Designed for load balancer health probes and
 * uptime monitoring.
 *
 * No authentication required. Rate-limit at the infrastructure level.
 */
export async function GET() {
  const start = performance.now()

  let dbStatus: 'connected' | 'error' = 'error'
  let dbError: string | undefined

  try {
    const payload = await getPayload({ config: configPromise })
    // Trivial DB ping — far cheaper than a filtered COUNT on every probe.
    const pool = (payload.db as unknown as { pool?: { query: (t: string) => Promise<unknown> } }).pool
    if (pool) {
      await pool.query('SELECT 1')
    } else {
      await payload.count({ collection: 'users' })
    }
    dbStatus = 'connected'
  } catch (err) {
    // Log full detail server-side; never expose raw DB errors (which can leak
    // connection/host detail), the Node version, or NODE_ENV to anonymous callers.
    dbError = err instanceof Error ? err.message : String(err)
    console.error('[health] DB check failed:', dbError)
  }

  const duration = Math.round(performance.now() - start)

  const body = {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    db: dbStatus,
    durationMs: duration,
  }

  const status = dbStatus === 'connected' ? 200 : 503

  return new NextResponse(JSON.stringify(body), {
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
    status,
  })
}
