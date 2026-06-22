/**
 * Trusted client-IP extraction.
 *
 * `X-Forwarded-For` is a comma-separated list where each proxy *appends* the
 * address it received the request from. The left-most entry is fully
 * attacker-controlled (the client can send any `X-Forwarded-For` it likes),
 * so keying rate limits / security logs on it lets an attacker rotate the
 * value per request and get a fresh bucket every time — defeating every limit.
 *
 * The only trustworthy hops are the right-most ones, added by infrastructure
 * we control (the platform edge / reverse proxy). `TRUSTED_PROXY_HOPS` is the
 * number of such hops in front of the app (Vercel / most single-LB setups: 1).
 * We select the entry `hops` from the right, which is the address as seen by
 * the first proxy we trust and cannot be spoofed by the client.
 */

function trustedProxyHops(): number {
  const raw = Number(process.env.TRUSTED_PROXY_HOPS)
  if (Number.isInteger(raw) && raw >= 1) return raw
  return 1
}

export function trustedClientIp(headers: Headers | null | undefined): string | null {
  if (!headers) return null

  // Platform-injected, single-value headers are not client-appendable and are
  // preferred when present (e.g. Vercel sets x-real-ip to the true client IP).
  const realIp = headers.get('x-real-ip')?.trim()

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const hops = forwarded
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)

    if (hops.length > 0) {
      const idx = Math.max(0, hops.length - trustedProxyHops())
      const candidate = hops[idx]
      if (candidate) return candidate
    }
  }

  if (realIp) return realIp

  return null
}
