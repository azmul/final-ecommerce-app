import { getEmbeddingConfig } from '@/lib/ai/config'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

export async function createEmbedding(text: string): Promise<number[] | null> {
  const config = getEmbeddingConfig()
  if (!config.enabled || !text.trim()) return null

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
  })

  if (!response.ok) return null

  const json = (await response.json()) as {
    data?: { embedding?: number[] }[]
  }

  const embedding = json.data?.[0]?.embedding
  return Array.isArray(embedding) ? embedding : null
}

export async function upsertProductEmbedding(args: {
  payload: Payload
  productId: number
  searchText: string
  embedding?: number[] | null
}): Promise<void> {
  const db = args.payload.db as {
    execute?: (query: unknown) => Promise<unknown>
  }

  if (!db.execute) return

  const embeddingValue = args.embedding?.length
    ? `[${args.embedding.join(',')}]`
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
  const db = args.payload.db as {
    execute?: (query: unknown) => Promise<{ rows?: { product_id: number; score: number }[] }>
  }

  if (!db.execute) return []

  const vector = `[${args.queryEmbedding.join(',')}]`

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
