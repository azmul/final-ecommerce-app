import { vectorSearchProductIds } from '@/lib/ai/embeddings'
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export async function fetchSimilarProductIds(args: {
  excludeProductId: number
  limit?: number
  payload: Payload
}): Promise<number[]> {
  const limit = args.limit ?? 8
  const adapter = args.payload.db as {
    drizzle?: { execute: (query: unknown) => Promise<{ rows?: { embedding?: string }[] }> }
  }
  const db = adapter.drizzle
  if (!db) return []

  const result = await db.execute(sql`
    SELECT embedding::text AS embedding
    FROM product_embeddings
    WHERE product_id = ${args.excludeProductId}
    LIMIT 1
  `)

  const embeddingText = result.rows?.[0]?.embedding
  if (!embeddingText) return []

  const embedding = embeddingText
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value))

  if (!embedding.length) return []

  const matches = await vectorSearchProductIds({
    limit: limit + 1,
    payload: args.payload,
    queryEmbedding: embedding,
  })

  return matches
    .map((row) => row.productId)
    .filter((id) => id !== args.excludeProductId)
    .slice(0, limit)
}
