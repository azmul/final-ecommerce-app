import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { monitoringConfig } from '@/monitoring/config'
import { allowRateLimit } from '@/utilities/edgeRateLimit'
import { trustedClientIp } from '@/utilities/clientIp'

type RequestLog = {
  durationMs: number
  ip: string | null
  method: string
  pathname: string
  status: number
  ts: string
  userId: number | null
}

const EXCLUDED_LOG_PREFIXES = monitoringConfig.requestLogging.excludePaths

function clientIp(request: NextRequest): string {
  // Use the trusted (right-most) forwarded hop so an attacker cannot rotate
  // X-Forwarded-For to get a fresh rate-limit bucket per request.
  return trustedClientIp(request.headers) || request.nextUrl.hostname || 'unknown'
}

const AUTH_RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/users/login': { limit: 5, windowMs: 60 * 1000 },
  '/api/custom/login': { limit: 5, windowMs: 60 * 1000 },
  '/api/users/logout': { limit: 10, windowMs: 60 * 1000 },
  '/api/users/forgot-password': { limit: 3, windowMs: 60 * 1000 },
  '/api/users/reset-password': { limit: 3, windowMs: 60 * 1000 },
  '/api/users/create': { limit: 10, windowMs: 60 * 60 * 1000 },
  '/api/users/refresh-token': { limit: 10, windowMs: 60 * 1000 },
}

const CHAT_RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/chat/conversations': { limit: 30, windowMs: 60 * 1000 },
}

const ANALYTICS_RATE_LIMIT = { limit: 120, windowMs: 60 * 1000 }

const AI_RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/admin/products/generate-field': { limit: 30, windowMs: 60 * 1000 },
  '/api/ai/assistant': { limit: 20, windowMs: 60 * 1000 },
  '/api/ai/compare': { limit: 20, windowMs: 60 * 1000 },
  '/api/ai/search-products': { limit: 30, windowMs: 60 * 1000 },
  '/api/ai/semantic-search': { limit: 30, windowMs: 60 * 1000 },
  '/api/ai/knowledge-search': { limit: 30, windowMs: 60 * 1000 },
  '/api/ai/visual-search': { limit: 10, windowMs: 60 * 1000 },
}

function shouldLogRequest(pathname: string): boolean {
  if (!monitoringConfig.requestLogging.enabled) return false
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/admin/')) return false
  return !EXCLUDED_LOG_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function extractUserIdFromCookie(request: NextRequest): number | null {
  const cookieName = 'payload-token'
  const token = request.cookies.get(cookieName)?.value
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const payload = JSON.parse(atob(parts[1]))
    return typeof payload.id === 'number' ? payload.id : null
  } catch {
    return null
  }
}

function logRequest(request: NextRequest, start: number): void {
  const { pathname } = request.nextUrl
  const durationMs = Math.round(performance.now() - start)

  const log: RequestLog = {
    durationMs,
    ip: clientIp(request),
    method: request.method,
    pathname,
    status: 200,
    ts: new Date().toISOString(),
    userId: extractUserIdFromCookie(request),
  }

  if (durationMs > monitoringConfig.requestLogging.slowRequestThresholdMs) {
    console.warn('[slow-request]', JSON.stringify(log))
  } else {
    console.log('[request]', JSON.stringify(log))
  }
}

export function proxy(request: NextRequest): NextResponse {
  const start = performance.now()
  const { pathname } = request.nextUrl
  const ip = clientIp(request)

  if (request.method === 'POST') {
    if (pathname === '/next/seed') {
      if (!allowRateLimit(`seed:${ip}`, 5, 15 * 60 * 1000)) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
    } else if (pathname in AUTH_RATE_LIMITS) {
      const { limit, windowMs } = AUTH_RATE_LIMITS[pathname]
      if (!allowRateLimit(`auth:${ip}:${pathname}`, limit, windowMs)) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
    } else if (pathname in CHAT_RATE_LIMITS || pathname.startsWith('/api/chat/conversations/')) {
      const key = pathname in CHAT_RATE_LIMITS ? pathname : '/api/chat/conversations/:id'
      const { limit, windowMs } =
        CHAT_RATE_LIMITS[pathname] ?? CHAT_RATE_LIMITS['/api/chat/conversations']
      if (!allowRateLimit(`chat:${ip}:${key}`, limit, windowMs)) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
    } else if (pathname === '/api/users') {
      if (!allowRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
      if (!allowRateLimit(`auth:${ip}:${pathname}`, 5, 60 * 1000)) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
    } else if (pathname === '/api/analytics/events') {
      if (!allowRateLimit(`analytics:${ip}`, ANALYTICS_RATE_LIMIT.limit, ANALYTICS_RATE_LIMIT.windowMs)) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
    } else if (pathname in AI_RATE_LIMITS) {
      const { limit, windowMs } = AI_RATE_LIMITS[pathname]
      if (!allowRateLimit(`ai:${ip}:${pathname}`, limit, windowMs)) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }
    }
  }

  if (shouldLogRequest(pathname)) {
    logRequest(request, start)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/next/seed'],
}
