import type { Payload } from 'payload'

import { monitoringConfig } from '@/monitoring/config'

export type CleanupResult = {
  adminAuditLogsDeleted: number
  securityEventsDeleted: number
}

type CollectionSlug = Parameters<Payload['find']>[0]['collection']

/**
 * Delete log entries older than their configured retention period.
 *
 * Uses batched deletes (1000 per iteration) to avoid memory issues
 * on large collections. Designed to be called from a cron job.
 */
export async function cleanupLogs(payload: Payload): Promise<CleanupResult> {
  const now = new Date()

  const adminAuditLogsDeleted = await deleteOlderThan(
    payload,
    'admin-audit-logs' as CollectionSlug,
    now,
    monitoringConfig.retention.adminAuditLogsDays,
  )

  const securityEventsDeleted = await deleteOlderThan(
    payload,
    'security-events' as CollectionSlug,
    now,
    monitoringConfig.retention.securityEventsDays,
  )

  return { adminAuditLogsDeleted, securityEventsDeleted }
}

async function deleteOlderThan(
  payload: Payload,
  collection: CollectionSlug,
  now: Date,
  days: number,
): Promise<number> {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

  // Single where-based bulk delete instead of N per-row round-trips.
  const result = await payload.delete({
    collection,
    overrideAccess: true,
    where: {
      createdAt: { less_than: cutoff },
    },
  })

  return result.docs?.length ?? 0
}
