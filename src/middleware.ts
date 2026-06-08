import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { allowRateLimit } from '@/utilities/edgeRateLimit'

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return request.nextUrl.hostname || 'unknown'
}

const AUTH_RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/users/login': { limit: 5, windowMs: 60 * 1000 },
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

export function middleware(request: NextRequest): NextResponse {
  if (request.method !== 'POST') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const ip = clientIp(request)

  if (pathname === '/next/seed') {
    if (!allowRateLimit(`seed:${ip}`, 5, 15 * 60 * 1000)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return NextResponse.next()
  }

  if (pathname in AUTH_RATE_LIMITS) {
    const { limit, windowMs } = AUTH_RATE_LIMITS[pathname]
    if (!allowRateLimit(`auth:${ip}:${pathname}`, limit, windowMs)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return NextResponse.next()
  }

  if (pathname in CHAT_RATE_LIMITS || pathname.startsWith('/api/chat/conversations/')) {
    const key = pathname in CHAT_RATE_LIMITS ? pathname : '/api/chat/conversations/:id'
    const { limit, windowMs } =
      CHAT_RATE_LIMITS[pathname] ?? CHAT_RATE_LIMITS['/api/chat/conversations']
    if (!allowRateLimit(`chat:${ip}:${key}`, limit, windowMs)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return NextResponse.next()
  }

  if (pathname === '/api/users') {
    if (!allowRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    if (!allowRateLimit(`auth:${ip}:${pathname}`, 5, 60 * 1000)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return NextResponse.next()
  }

  if (pathname === '/api/analytics/events') {
    if (!allowRateLimit(`analytics:${ip}`, ANALYTICS_RATE_LIMIT.limit, ANALYTICS_RATE_LIMIT.windowMs)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return NextResponse.next()
  }

  if (pathname in AI_RATE_LIMITS) {
    const { limit, windowMs } = AI_RATE_LIMITS[pathname]
    if (!allowRateLimit(`ai:${ip}:${pathname}`, limit, windowMs)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/users',
    '/api/users/:path*',
    '/api/chat/conversations',
    '/api/chat/conversations/:path*',
    '/api/analytics/events',
    '/api/ai/assistant',
    '/api/ai/compare',
    '/api/ai/search-products',
    '/api/ai/semantic-search',
    '/api/ai/knowledge-search',
    '/api/ai/visual-search',
    '/next/seed',
  ],
}
