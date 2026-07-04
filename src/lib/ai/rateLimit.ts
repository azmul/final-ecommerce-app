import { NextResponse } from 'next/server'
import { constantTimeEquals } from '@/utilities/edgeRateLimit'
import { trustedClientIp } from '@/utilities/clientIp'
import { isSameOrigin } from '@/lib/http/assertSameOrigin'

/**
 * Result of a single rate-limit check.
 *
 * - `ok`: whether the request is allowed (a token was consumed).
 * - `limit`: the configured bucket capacity.
 * - `remaining`: tokens left in the current window after this check.
 * - `reset`: unix epoch in **milliseconds** when the bucket refills.
 */
export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  /** Unix epoch in milliseconds at which the window resets. */
  reset: number
}

type Bucket = {
  tokens: number
  resetAt: number
}

// Module-level store. Token-bucket per `key`. In-memory only — best-effort per
// server instance; use Redis/Upstash for multi-instance production deployments.
const buckets = new Map<string, Bucket>()

// Soft cap to keep the map from growing unbounded under attack.
const MAX_BUCKETS = 10_000
const PRUNE_INTERVAL_MS = 30_000
let lastPrune = Date.now()

function prune(now: number): void {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return
  lastPrune = now
  if (buckets.size < MAX_BUCKETS * 0.8) return
  for (const [k, v] of buckets) {
    if (now >= v.resetAt) buckets.delete(k)
  }
}

/**
 * Token-bucket rate limiter (in-memory, per-process).
 *
 * Each `key` gets its own bucket of `limit` tokens that refills every
 * `windowMs` milliseconds. Each call consumes one token if available.
 *
 * @example
 * const r = rateLimit({ key: 'ip:1.2.3.4', limit: 30, windowMs: 60_000 })
 * if (!r.ok) return new Response('Too Many Requests', { status: 429 })
 */
export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}): RateLimitResult {
  const now = Date.now()
  prune(now)

  // Hard cap protection: if the map is full, opportunistically evict expired
  // buckets; if still full, reject the request to avoid memory blow-up.
  if (buckets.size >= MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k)
    }
    if (buckets.size >= MAX_BUCKETS) {
      return { ok: false, limit, remaining: 0, reset: now + windowMs }
    }
  }

  let bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    bucket = { tokens: limit, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }

  if (bucket.tokens <= 0) {
    return { ok: false, limit, remaining: 0, reset: bucket.resetAt }
  }

  bucket.tokens -= 1
  return { ok: true, limit, remaining: bucket.tokens, reset: bucket.resetAt }
}

/**
 * Mutates `res` to include standard rate-limit headers and returns it.
 *
 * Sets:
 * - `X-RateLimit-Limit`: configured bucket capacity.
 * - `X-RateLimit-Remaining`: tokens remaining after the check.
 * - `X-RateLimit-Reset`: window reset time as **epoch seconds**.
 * - `Retry-After`: seconds until reset, only when `result.ok === false`.
 *
 * Note: `Response` headers are mutable; this writes to `res.headers` in place
 * and returns the same instance for chaining.
 */
export function applyRateLimitHeaders(res: Response, result: RateLimitResult): Response {
  const resetSeconds = Math.ceil(result.reset / 1000)
  res.headers.set('X-RateLimit-Limit', String(result.limit))
  res.headers.set('X-RateLimit-Remaining', String(Math.max(0, result.remaining)))
  res.headers.set('X-RateLimit-Reset', String(resetSeconds))
  if (!result.ok) {
    const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))
    res.headers.set('Retry-After', String(retryAfter))
  }
  return res
}

/**
 * Trusted client identifier for rate-limit keying.
 *
 * Uses {@link trustedClientIp}, which reads the right-most (infrastructure-added)
 * `X-Forwarded-For` hop rather than the left-most, client-controlled value —
 * otherwise an attacker could rotate `X-Forwarded-For` per request to mint a
 * fresh bucket every time and bypass the limit entirely. Falls back to `'anon'`
 * so a missing IP collapses all such callers into one shared bucket instead of
 * being unlimited.
 */
export function clientKey(req: Request): string {
  return trustedClientIp(req.headers) ?? 'anon'
}

/**
 * Validates an API key against `process.env.AI_API_KEY`.
 *
 * Accepts either `Authorization: Bearer <key>` or `X-API-Key: <key>`. When
 * `AI_API_KEY` is **not set**, all requests pass (`ok: true`) — useful for
 * local development. Uses constant-time comparison to mitigate timing attacks.
 */
export function checkApiKey(req: Request): { ok: boolean; reason?: string } {
  const expected = process.env.AI_API_KEY
  if (!expected) return { ok: true }

  const auth = req.headers.get('authorization')
  const apiKeyHeader = req.headers.get('x-api-key')

  let provided: string | null = null
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim())
    if (match && match[1]) provided = match[1].trim()
  }
  if (!provided && apiKeyHeader) {
    provided = apiKeyHeader.trim()
  }

  if (!provided) {
    return { ok: false, reason: 'Missing API key' }
  }
  if (!constantTimeEquals(provided, expected)) {
    return { ok: false, reason: 'Invalid API key' }
  }
  return { ok: true }
}

/** Tuning for {@link withAiPostHandler}. */
export type AiPostHandlerOptions = {
  /** Bucket capacity per window (default 30). Use a lower value for costly endpoints. */
  limit?: number
  /** Window length in ms (default 60_000). */
  windowMs?: number
}

/**
 * Wraps a Next.js Route Handler with abuse controls for the (public) AI
 * endpoints. These endpoints each trigger paid LLM / embedding calls, so the
 * goal is to stop an attacker from burning the API budget.
 *
 * Behavior:
 * 1. {@link checkApiKey}. If it fails, returns `401`.
 * 2. When no server-to-server `AI_API_KEY` is configured (the storefront case),
 *    requires a first-party {@link isSameOrigin} request — a valid API key
 *    bypasses this so trusted backends can still call cross-origin. This blocks
 *    off-site scripts from driving the endpoint with the visitor's budget.
 * 3. {@link rateLimit} keyed by the trusted client IP ({@link clientKey}).
 *    Rejected requests get `429` with `Retry-After` / `X-RateLimit-*`.
 * 4. Otherwise invokes `handler` and decorates its response.
 *
 * This is a second layer behind the edge middleware (`proxy.ts`), which already
 * rate-limits these paths by trusted IP.
 *
 * @example
 * export const POST = withAiPostHandler(handler, { limit: 10, windowMs: 60_000 })
 */
export function withAiPostHandler(
  handler: (req: Request, ctx: any) => Promise<Response>,
  options: AiPostHandlerOptions = {},
): (req: Request, ctx: any) => Promise<Response> {
  const { limit = 30, windowMs = 60_000 } = options

  return async (req: Request, ctx: any): Promise<Response> => {
    const auth = checkApiKey(req)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.reason ?? 'Unauthorized' }, { status: 401 })
    }

    // Browser (keyless) callers must be first-party; a configured API key is the
    // opt-out for trusted server-to-server integrations.
    if (!process.env.AI_API_KEY && !isSameOrigin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = rateLimit({
      key: clientKey(req),
      limit,
      windowMs,
    })
    if (!result.ok) {
      const res = NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
      return applyRateLimitHeaders(res, result)
    }

    const res = await handler(req, ctx)
    return applyRateLimitHeaders(res, result)
  }
}
