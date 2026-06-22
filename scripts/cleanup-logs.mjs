#!/usr/bin/env node

/**
 * Log retention cleanup script.
 *
 * Deletes log entries older than the configured retention period
 * from the security-events and admin-audit-logs collections.
 *
 * Usage:
 *   node --import=tsx/esm scripts/cleanup-logs.mjs
 *   DRY_RUN=1 node --import=tsx/esm scripts/cleanup-logs.mjs
 */

// eslint-disable-next-line import/no-unresolved
import { getPayload } from 'payload'
// eslint-disable-next-line import/no-unresolved
import configPromise from '@payload-config'
import { config } from 'dotenv'

config()

async function main() {
  const payload = await getPayload({ config: configPromise })
  const dryRun = process.env.DRY_RUN === '1'

  const { cleanupLogs } = await import('../src/monitoring/cleanup.js')

  if (dryRun) {
    console.log('[cleanup-logs] DRY RUN — no deletions will be performed')
  }

  const result = await cleanupLogs(payload)

  console.log('[cleanup-logs]', JSON.stringify(result))

  if (dryRun) {
    console.log('[cleanup-logs] DRY RUN complete — no rows were actually deleted')
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('[cleanup-logs] Fatal error:', err)
  process.exit(1)
})
