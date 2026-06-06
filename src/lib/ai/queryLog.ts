import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

type PostgresDrizzle = {
  execute: (query: unknown) => Promise<unknown>
}

function getPostgresDrizzle(payload: Payload): PostgresDrizzle | null {
  const adapter = payload.db as { drizzle?: PostgresDrizzle }
  return adapter.drizzle ?? null
}

export type AiQueryLogInput = {
  latencyMs?: number
  model?: string
  queryText?: string
  queryType: string
  resultsCount?: number
  sessionId?: string
  userId?: number
}

export async function logAiQuery(payload: Payload, input: AiQueryLogInput): Promise<void> {
  const db = getPostgresDrizzle(payload)
  if (!db) return

  try {
    await db.execute(sql`
      INSERT INTO "ai_query_logs" (
        "query_type", "query_text", "results_count", "latency_ms", "model", "user_id", "session_id"
      ) VALUES (
        ${input.queryType},
        ${input.queryText ?? null},
        ${input.resultsCount ?? null},
        ${input.latencyMs ?? null},
        ${input.model ?? null},
        ${input.userId ?? null},
        ${input.sessionId ?? null}
      )
    `)

    await db.execute(sql`
      DELETE FROM "ai_query_logs"
      WHERE "created_at" < now() - INTERVAL '30 days'
    `)
  } catch {
    // Non-critical observability — do not block user flows.
  }
}
