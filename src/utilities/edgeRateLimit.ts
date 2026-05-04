type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function prune(now: number): void {
  if (buckets.size < 5000) return
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k)
  }
}

/** Fixed-window limiter for Edge middleware (best-effort per isolate). */
export function allowRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  prune(now)

  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) {
    return false
  }

  bucket.count += 1
  return true
}
