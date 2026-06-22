import type { Payload } from 'payload'

import type { SecurityEventType } from '@/monitoring/SecurityEvents'

export type SecurityEventInput = {
  eventType: SecurityEventType
  actor?: number | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
  summary?: string | null
}

/**
 * Fire-and-forget security event logger.
 *
 * Writes a row to the `security-events` collection. Never throws —
 * failures are logged to console.warn instead.
 *
 * Call from any route or hook that handles security-relevant operations:
 *   - Failed authentication attempts (email + OAuth)
 *   - Password / role changes
 *   - Access control denials for staff/admin
 *   - Suspicious activity detected by risk scoring
 */
export async function logSecurityEvent(
  payload: Payload,
  input: SecurityEventInput,
): Promise<void> {
  try {
    await (payload.create as any)({
      collection: 'security-events',
      data: {
        eventType: input.eventType,
        ...(input.actor ? { actor: input.actor } : {}),
        ...(input.ip ? { ip: input.ip } : {}),
        ...(input.userAgent ? { userAgent: input.userAgent } : {}),
        ...(input.summary ? { summary: input.summary } : {}),
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
      overrideAccess: true,
    })
  } catch (err) {
    console.warn('[security-event]', err)
  }
}
