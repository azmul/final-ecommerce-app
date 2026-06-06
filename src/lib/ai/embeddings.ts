import { getEmbeddingConfig } from '@/lib/ai/config'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

type PostgresDrizzle = {
  execute: (query: unknown) => Promise<{ rows?: { product_id: number; score: number }[] }>
}

function getPostgresDrizzle(payload: Payload): PostgresDrizzle | null {
  const adapter = payload.db as { drizzle?: PostgresDrizzle }
  return adapter.drizzle ?? null
}

function validateAndFormatVector(embedding: number[]): string {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Invalid embedding: must be non-empty array')
  }
  for (const n of embedding) {
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      throw new Error('Invalid embedding: all elements must be finite numbers')
    }
  }
  return `[${embedding.join(',')}]`
}
export { validateAndFormatVector }

export async function createEmbedding(text: string): Promise<number[] | null> {
  const config = getEmbeddingConfig()
  if (!config.enabled || !text.trim()) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(`${config.baseUrl}/embeddings`, {
      body: JSON.stringify({
        input: text,
        model: config.model,
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    })

    if (!response.ok) return null

    const json = (await response.json()) as {
      data?: { embedding?: number[] }[]
    }

    const embedding = json.data?.[0]?.embedding
    return Array.isArray(embedding) ? embedding : null
  } finally {
    clearTimeout(timeout)
  }
}

export async function upsertProductEmbedding(args: {
  payload: Payload
  productId: number
  searchText: string
  embedding?: number[] | null
}): Promise<void> {
  const db = getPostgresDrizzle(args.payload)
  if (!db) return

  const embeddingValue = args.embedding?.length
    ? validateAndFormatVector(args.embedding)
    : null

  await db.execute(sql`
    INSERT INTO "product_embeddings" ("product_id", "search_text", "embedding", "updated_at")
    VALUES (
      ${args.productId},
      ${args.searchText},
      ${embeddingValue}::vector,
      now()
    )
    ON CONFLICT ("product_id") DO UPDATE SET
      "search_text" = EXCLUDED."search_text",
      "embedding" = EXCLUDED."embedding",
      "updated_at" = now()
  `)
}

export async function vectorSearchProductIds(args: {
  payload: Payload
  queryEmbedding: number[]
  limit: number
}): Promise<{ productId: number; score: number }[]> {
  const db = getPostgresDrizzle(args.payload)
  if (!db) return []

  const vector = validateAndFormatVector(args.queryEmbedding)

  try {
    const result = await db.execute(sql`
      SELECT
        "product_id",
        1 - ("embedding" <=> ${vector}::vector) AS score
      FROM "product_embeddings"
      WHERE "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${vector}::vector
      LIMIT ${args.limit}
    `)

    const rows = result.rows ?? []
    return rows
      .map((row) => ({ productId: row.product_id, score: Number(row.score) }))
      .filter((row) => Number.isFinite(row.productId))
  } catch {
    return []
  }
}

export async function getProductEmbeddingVector(args: {
  payload: Payload
  productId: number
}): Promise<number[] | null> {
  const db = getPostgresDrizzle(args.payload)
  if (!db) return null

  try {
    const result = await db.execute(sql`
      SELECT "embedding"::text AS embedding
      FROM "product_embeddings"
      WHERE "product_id" = ${args.productId}
      LIMIT 1
    `)

    const rows = (result as { rows?: { embedding?: unknown }[] }).rows ?? []
    const raw = rows[0]?.embedding
    if (typeof raw !== 'string') return null

    const match = raw.match(/\[([^\]]+)\]/)
    if (!match) return null

    const values = match[1]
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isFinite(n))

    return values.length ? values : null
  } catch {
    return null
  }
}
