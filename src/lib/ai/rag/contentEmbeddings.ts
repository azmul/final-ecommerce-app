import { createEmbeddings, validateAndFormatVector } from '@/lib/ai/embeddings'
import { getPostgresDrizzle } from '@/lib/ai/db'
import type { KnowledgeChunkInput, KnowledgeSearchMatch } from '@/lib/ai/rag/types'
import { tokenizeForRag } from '@/lib/ai/rag/rerank'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

const MAX_CHUNK_CHARS = 4000

function mapSearchRow(row: Record<string, unknown>): KnowledgeSearchMatch {
  return {
    chunkText: String(row.chunk_text ?? ''),
    score: Number(row.score),
    sourceCollection: row.source_collection ? String(row.source_collection) : undefined,
    sourceId: Number(row.source_id),
    sourceSlug: row.source_slug ? String(row.source_slug) : undefined,
    sourceType: String(row.source_type),
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    title: row.title ? String(row.title) : undefined,
    vectorScore: row.vector_score != null ? Number(row.vector_score) : undefined,
  }
}

export async function deleteContentEmbeddings(args: {
  payload: Payload
  sourceId: number
  sourceType: string
}): Promise<void> {
  const db = getPostgresDrizzle(args.payload)
  if (!db) return

  await db.execute(sql`
    DELETE FROM "content_embeddings"
    WHERE "source_type" = ${args.sourceType} AND "source_id" = ${args.sourceId}
  `)
}

export async function replaceContentEmbeddings(args: {
  chunks: KnowledgeChunkInput[]
  payload: Payload
  sourceId: number
  sourceType: string
}): Promise<void> {
  const db = getPostgresDrizzle(args.payload)
  if (!db) return

  await db.execute(sql`
    DELETE FROM "content_embeddings"
    WHERE "source_type" = ${args.sourceType} AND "source_id" = ${args.sourceId}
  `)

  if (!args.chunks.length) return

  const texts = args.chunks.map((chunk) => chunk.chunkText.slice(0, MAX_CHUNK_CHARS))
  const embeddings = await createEmbeddings(texts)

  for (const [index, chunk] of args.chunks.entries()) {
    const embedding = embeddings[index]
    const embeddingValue = embedding?.length ? validateAndFormatVector(embedding) : null

    await db.execute(sql`
      INSERT INTO "content_embeddings" (
        "source_type",
        "source_id",
        "chunk_index",
        "title",
        "source_slug",
        "source_collection",
        "source_url",
        "chunk_text",
        "embedding",
        "updated_at"
      )
      VALUES (
        ${args.sourceType},
        ${args.sourceId},
        ${chunk.chunkIndex},
        ${chunk.title ?? null},
        ${chunk.sourceSlug ?? null},
        ${chunk.sourceCollection ?? args.sourceType},
        ${chunk.sourceUrl ?? null},
        ${chunk.chunkText.slice(0, MAX_CHUNK_CHARS)},
        ${embeddingValue}::vector,
        now()
      )
    `)
  }
}

export async function searchContentEmbeddings(args: {
  limit: number
  payload: Payload
  queryEmbedding: number[]
}): Promise<KnowledgeSearchMatch[]> {
  const db = getPostgresDrizzle(args.payload)
  if (!db || !args.queryEmbedding.length) return []

  const vector = validateAndFormatVector(args.queryEmbedding)

  try {
    const result = await db.execute(sql`
      SELECT
        "source_type",
        "source_id",
        "source_slug",
        "source_collection",
        "source_url",
        "title",
        "chunk_text",
        1 - ("embedding" <=> ${vector}::vector) AS score,
        1 - ("embedding" <=> ${vector}::vector) AS vector_score
      FROM "content_embeddings"
      WHERE "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${vector}::vector
      LIMIT ${args.limit}
    `)

    return (result.rows ?? []).map((row) => mapSearchRow(row as Record<string, unknown>))
  } catch {
    return []
  }
}

export async function keywordSearchContentEmbeddings(args: {
  limit: number
  payload: Payload
  query: string
}): Promise<KnowledgeSearchMatch[]> {
  const db = getPostgresDrizzle(args.payload)
  if (!db) return []

  const terms = tokenizeForRag(args.query).slice(0, 6)
  if (!terms.length) return []

  try {
    const result = await db.execute(sql`
      SELECT
        "source_type",
        "source_id",
        "source_slug",
        "source_collection",
        "source_url",
        "title",
        "chunk_text",
        (
          ${sql.join(
            terms.map(
              (term) =>
                sql`(CASE WHEN lower("chunk_text") LIKE ${`%${term}%`} THEN 1 ELSE 0 END)`,
            ),
            sql` + `,
          )}
        )::float / ${terms.length} AS score
      FROM "content_embeddings"
      WHERE ${sql.join(
        terms.map((term) => sql`lower("chunk_text") LIKE ${`%${term}%`}`),
        sql` OR `,
      )}
      ORDER BY score DESC, "updated_at" DESC
      LIMIT ${args.limit}
    `)

    return (result.rows ?? []).map((row) => mapSearchRow(row as Record<string, unknown>))
  } catch {
    return []
  }
}
