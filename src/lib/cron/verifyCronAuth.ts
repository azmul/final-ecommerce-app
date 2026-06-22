import crypto from 'crypto'

export type CronAuthResult = { ok: true } | { ok: false; status: 401 | 503; message: string }

/**
 * Verifies the `Authorization: Bearer <CRON_SECRET>` header for cron routes.
 *
 * Uses a constant-time comparison so the secret can't be recovered by timing
 * the response. Fails closed (503) when the secret is not configured.
 */
export function verifyCronAuth(request: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return { ok: false, status: 503, message: 'CRON_SECRET is not configured.' }
  }

  const provided = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`

  const providedBuf = Buffer.from(provided)
  const expectedBuf = Buffer.from(expected)

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return { ok: false, status: 401, message: 'Unauthorized.' }
  }

  return { ok: true }
}
