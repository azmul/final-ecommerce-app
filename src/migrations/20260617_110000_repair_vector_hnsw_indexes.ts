import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Idempotent repair for pgvector HNSW indexes used by AI search and RAG. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE INDEX IF NOT EXISTS "product_embeddings_hnsw_idx"
      ON "product_embeddings" USING hnsw ("embedding" vector_cosine_ops)
      WHERE "embedding" IS NOT NULL;

    CREATE INDEX IF NOT EXISTS "content_embeddings_hnsw_idx"
      ON "content_embeddings" USING hnsw ("embedding" vector_cosine_ops)
      WHERE "embedding" IS NOT NULL;

    CREATE INDEX IF NOT EXISTS "product_image_embeddings_hnsw_idx"
      ON "product_image_embeddings" USING hnsw ("embedding" vector_cosine_ops)
      WHERE "embedding" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "product_image_embeddings_hnsw_idx";
    DROP INDEX IF EXISTS "content_embeddings_hnsw_idx";
    DROP INDEX IF EXISTS "product_embeddings_hnsw_idx";
  `)
}
