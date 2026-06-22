import type { RequestContext } from '@/lib/risk/types'
import { trustedClientIp } from '@/utilities/clientIp'

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
  // Trust only the right-most (infrastructure-added) forwarded hops; the
  // left-most X-Forwarded-For entry is attacker-controlled. See clientIp util.
  return trustedClientIp(headers)
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
