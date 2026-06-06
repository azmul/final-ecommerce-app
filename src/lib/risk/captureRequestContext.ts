import type { RequestContext } from '@/lib/risk/types'

type RequestHeaderSource = {
  headers?: Headers | null
} | null | undefined

function headerValue(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === 'string' && entry.trim())
    return first?.trim() ?? null
  }
  return null
}

export function clientIpFromHeaders(headers: Headers | null | undefined): string | null {
  const forwarded = headerValue(headers?.get?.('x-forwarded-for') ?? undefined)
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = headerValue(headers?.get?.('x-real-ip') ?? undefined)
  if (realIp) return realIp

  return null
}

export function captureRequestContext(req?: RequestHeaderSource): RequestContext {
  if (!req?.headers) {
    return { ip: null, userAgent: null }
  }

  return {
    ip: clientIpFromHeaders(req.headers),
    userAgent: headerValue(req.headers.get('user-agent') ?? undefined),
  }
}
