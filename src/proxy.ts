import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { monitoringConfig } from '@/monitoring/config'
import { allowRateLimit } from '@/utilities/edgeRateLimit'
import { trustedClientIp } from '@/utilities/clientIp'
import {
  ADMIN_LOGIN_GUARD_COOKIE_NAME,
  ADMIN_LOGIN_GUARD_WINDOW_SECONDS,
  decideAdminLoginRedirect,
} from '@/utilities/adminLoginRedirectGuard'
import {
  PAYLOAD_AUTH_COOKIE_NAME,
  canAccessAdminFromJwtPayload,
  decodePayloadAuthJwt,
} from '@/utilities/decodePayloadAuthCookie'

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
  const token = request.cookies.get(PAYLOAD_AUTH_COOKIE_NAME)?.value
  const payload = decodePayloadAuthJwt(token)
  return typeof payload?.id === 'number' ? payload.id : null
}

/**
 * Redirect an already-authenticated admin away from the login page — unless the
 * server keeps bouncing them back (auth cookie decodes but Payload rejects it),
 * in which case break the loop: clear the auth cookie so the login form renders.
 */
function redirectAuthenticatedAdminFromLogin(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (pathname !== '/admin/login') return null

  const token = request.cookies.get(PAYLOAD_AUTH_COOKIE_NAME)?.value
  const jwtPayload = decodePayloadAuthJwt(token)
  if (!canAccessAdminFromJwtPayload(jwtPayload)) return null

  const decision = decideAdminLoginRedirect(
    request.cookies.get(ADMIN_LOGIN_GUARD_COOKIE_NAME)?.value,
    Date.now(),
  )

  if (decision.action === 'break-loop') {
    console.error(
      '[admin-login] Redirect loop detected: /admin/login → /admin bounced repeatedly. ' +
        `Clearing ${PAYLOAD_AUTH_COOKIE_NAME} so the login form renders. ` +
        'Likely cause: NEXT_PUBLIC_SERVER_URL / PAYLOAD_PUBLIC_SERVER_URL / ALLOWED_ORIGINS do not match the ' +
        'browser origin — fix .env, rebuild, and restart (see README "Payload Admin on VPS IP").',
    )
    const response = NextResponse.next()
    response.cookies.delete({ name: PAYLOAD_AUTH_COOKIE_NAME, path: '/' })
    response.cookies.delete({ name: ADMIN_LOGIN_GUARD_COOKIE_NAME, path: '/admin' })
    // A guard cookie planted at Path=/ would survive the /admin-scoped delete
    // (RFC 6265 keys cookies by name+domain+path) and re-trigger break-loop forever.
    response.headers.append(
      'set-cookie',
      `${ADMIN_LOGIN_GUARD_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`,
    )
    return response
  }

  const url = request.nextUrl.clone()
  url.pathname = '/admin'
  url.search = ''

  const response = NextResponse.redirect(url)
  response.cookies.set(ADMIN_LOGIN_GUARD_COOKIE_NAME, decision.cookieValue, {
    httpOnly: true,
    maxAge: ADMIN_LOGIN_GUARD_WINDOW_SECONDS,
    path: '/admin',
    sameSite: 'lax',
  })
  return response
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

  const adminLoginRedirect = redirectAuthenticatedAdminFromLogin(request)
  if (adminLoginRedirect) {
    if (shouldLogRequest(pathname)) {
      logRequest(request, start)
    }
    adminLoginRedirect.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    )
    return adminLoginRedirect
  }

  if (shouldLogRequest(pathname)) {
    logRequest(request, start)
  }

  const response = NextResponse.next()

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/admin', '/admin/:path*', '/next/seed'],
}
