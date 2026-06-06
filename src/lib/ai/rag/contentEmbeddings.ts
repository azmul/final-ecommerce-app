import { createEmbedding, validateAndFormatVector } from '@/lib/ai/embeddings'
import { getPostgresDrizzle } from '@/lib/ai/db'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

export async function upsertContentEmbedding(args: {
  chunkText: string
  embedding: number[] | null
  payload: Payload
  sourceId: number
  sourceType: string
}): Promise<void> {
  const db = getPostgresDrizzle(args.payload)
  if (!db) return

  const embeddingValue = args.embedding?.length ? validateAndFormatVector(args.embedding) : null

  await db.execute(sql`
    DELETE FROM "content_embeddings"
    WHERE "source_type" = ${args.sourceType} AND "source_id" = ${args.sourceId}
  `)

  await db.execute(sql`
    INSERT INTO "content_embeddings" ("source_type", "source_id", "chunk_text", "embedding", "updated_at")
    VALUES (
      ${args.sourceType},
      ${args.sourceId},
      ${args.chunkText},
      ${embeddingValue}::vector,
      now()
    )
  `)
}

export async function searchContentEmbeddings(args: {
  limit: number
  payload: Payload
  queryEmbedding: number[]
}): Promise<{ chunkText: string; score: number; sourceId: number; sourceType: string }[]> {
  const db = getPostgresDrizzle(args.payload)
  if (!db || !args.queryEmbedding.length) return []

  const vector = validateAndFormatVector(args.queryEmbedding)

  try {
    const result = await db.execute(sql`
      SELECT
        "source_type",
        "source_id",
        "chunk_text",
        1 - ("embedding" <=> ${vector}::vector) AS score
      FROM "content_embeddings"
      WHERE "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${vector}::vector
      LIMIT ${args.limit}
    `)

    return (result.rows ?? []).map((row) => ({
      chunkText: String(row.chunk_text ?? ''),
      score: Number(row.score),
      sourceId: Number(row.source_id),
      sourceType: String(row.source_type),
    }))
  } catch {
    return []
  }
}

export async function syncPageContentEmbedding(args: {
  pageId: number
  payload: Payload
  text: string
  sourceType?: string
}): Promise<void> {
  const embedding = await createEmbedding(args.text.slice(0, 4000))
  await upsertContentEmbedding({
    chunkText: args.text.slice(0, 4000),
    embedding,
    payload: args.payload,
    sourceId: args.pageId,
    sourceType: args.sourceType ?? 'page',
  })
}
