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

const SENSITIVE_AUTH_PATHS = new Set([
  '/api/users/login',
  '/api/users/logout',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/users/create',
  '/api/users/refresh-token',
])

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

  if (SENSITIVE_AUTH_PATHS.has(pathname)) {
    if (!allowRateLimit(`auth:${ip}:${pathname}`, 30, 60 * 1000)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return NextResponse.next()
  }

  /** Public registration (`POST /api/users`). */
  if (pathname === '/api/users') {
    if (!allowRateLimit(`register:${ip}`, 10, 60 * 60 * 1000)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    if (!allowRateLimit(`auth:${ip}:${pathname}`, 30, 60 * 1000)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/users', '/api/users/:path*', '/next/seed'],
}
