import { getServerSideURL } from './getURL'

/** Fix common `.env` typos such as `http:/203.0.113.10:3000` (one slash). */
export function normalizePublicUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/^(https?):\/(?!\/)/, '$1://')
}

function toOrigin(value: string | undefined): string | null {
  const normalized = normalizePublicUrl(value)
  if (!normalized) return null

  try {
    return new URL(normalized).origin
  } catch {
    console.warn(`[config] Ignoring invalid origin: ${normalized}`)
    return null
  }
}

/** Include both `:3000` and default-port variants so IP/VPS access matches the browser Origin. */
function expandOriginVariants(origin: string): string[] {
  try {
    const url = new URL(origin)
    const variants = new Set<string>([origin])

    if (url.port === '3000') {
      variants.add(`${url.protocol}//${url.hostname}`)
    } else if (!url.port && (url.protocol === 'http:' || url.protocol === 'https:')) {
      variants.add(`${url.protocol}//${url.hostname}:3000`)
    }

    return [...variants]
  } catch {
    return [origin]
  }
}

/** Origins derived from env — used when strict CSRF is enabled (local dev / production domain). */
export function collectPayloadAllowedOrigins(): string[] {
  const raw = [
    getServerSideURL(),
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []),
  ]

  return Array.from(
    new Set(
      raw
        .map(toOrigin)
        .filter((origin): origin is string => Boolean(origin))
        .flatMap(expandOriginVariants),
    ),
  )
}

function isIpLiteralHost(hostname: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true
  // Bracketed or bare IPv6 (e.g. [::1] or 2001:db8::1)
  if (hostname.startsWith('[') && hostname.endsWith(']')) return true
  if (hostname.includes(':') && !hostname.includes('.')) return true
  return false
}

/**
 * Payload rejects auth cookies when the request Origin is not in `csrf`.
 * That breaks admin login on VPS IP access (port / http vs https mismatches).
 *
 * When relaxed, `csrf: []` disables the Origin allowlist (Payload default behavior).
 * Auto-enabled for IP-based `NEXT_PUBLIC_SERVER_URL`; override with env vars below.
 */
export function shouldRelaxPayloadOriginChecks(): boolean {
  if (process.env.PAYLOAD_STRICT_CSRF === 'true') return false
  if (process.env.PAYLOAD_RELAX_CSRF === 'true') return true
  if (process.env.PAYLOAD_RELAX_CSRF === 'false') return false

  try {
    const { hostname } = new URL(getServerSideURL())
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false
    }
    return isIpLiteralHost(hostname)
  } catch {
    return false
  }
}

export type PayloadOriginPolicy = {
  cors: '*' | string[]
  csrf: string[]
  mode: 'relaxed' | 'strict'
  origins: string[]
}

export function getPayloadOriginPolicy(): PayloadOriginPolicy {
  const origins = collectPayloadAllowedOrigins()

  if (shouldRelaxPayloadOriginChecks()) {
    return {
      cors: '*',
      csrf: [],
      mode: 'relaxed',
      origins,
    }
  }

  return {
    cors: origins,
    csrf: origins,
    mode: 'strict',
    origins,
  }
}

/** For Next.js `serverActions.allowedOrigins` on VPS / multi-origin admin access. */
export function getServerActionAllowedOrigins(): string[] {
  const origins = collectPayloadAllowedOrigins()
  if (shouldRelaxPayloadOriginChecks()) {
    return origins.length > 0 ? origins : ['*']
  }
  return origins
}

/** Auth cookies must not use Secure on plain-HTTP VPS deployments. */
export function payloadAuthCookiesSecure(): boolean {
  const url = normalizePublicUrl(
    process.env.NEXT_PUBLIC_SERVER_URL ?? process.env.PAYLOAD_PUBLIC_SERVER_URL,
  )
  return url?.startsWith('https://') ?? false
}
