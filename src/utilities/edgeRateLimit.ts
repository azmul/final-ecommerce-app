const MAX_BUCKETS = 10000
const PRUNE_INTERVAL_MS = 30_000

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastPrune = Date.now()

function prune(now: number): void {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return
  lastPrune = now
  if (buckets.size < MAX_BUCKETS * 0.8) return
  for (const [k, v] of buckets) {
    if (now >= v.resetAt) buckets.delete(k)
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/** Fixed-window limiter for Edge middleware (best-effort per isolate).
 *  Use external Redis/Upstash for production multi-instance deployments. */
export function allowRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  prune(now)

  if (buckets.size >= MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k)
    }
    if (buckets.size >= MAX_BUCKETS) {
      return false
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) {
    return false
  }

  bucket.count += 1
  return true
}

export { constantTimeEquals }
