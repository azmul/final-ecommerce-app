#!/usr/bin/env node
/**
 * Backfill automated risk scores for recent orders and users.
 *
 *   pnpm backfill:risk
 *   pnpm backfill:risk -- --days=60
 *   pnpm backfill:risk -- --dry-run
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import { backfillRiskScores } from '../src/lib/risk/backfillRiskScores.ts'
import config from '../src/payload.config.ts'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const daysArg = args.find((entry) => entry.startsWith('--days='))
const days = daysArg ? Number(daysArg.split('=')[1]) : 30

const payload = await getPayload({ config })

console.log(`Backfilling risk scores (days=${days}, dryRun=${dryRun})...`)

const result = await backfillRiskScores({
  payload,
  days: Number.isFinite(days) ? days : 30,
  dryRun,
})

console.log(JSON.stringify(result, null, 2))
console.log('Done.')
process.exit(0)
