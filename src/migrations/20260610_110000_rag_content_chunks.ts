import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "content_embeddings"
      ADD COLUMN IF NOT EXISTS "chunk_index" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "title" varchar,
      ADD COLUMN IF NOT EXISTS "source_slug" varchar;

    CREATE UNIQUE INDEX IF NOT EXISTS "content_embeddings_source_chunk_idx"
      ON "content_embeddings" ("source_type", "source_id", "chunk_index");

    CREATE INDEX IF NOT EXISTS "content_embeddings_fts_idx"
      ON "content_embeddings"
      USING gin (to_tsvector('simple', coalesce("title", '') || ' ' || "chunk_text"));
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "content_embeddings_fts_idx";
    DROP INDEX IF EXISTS "content_embeddings_source_chunk_idx";

    ALTER TABLE "content_embeddings"
      DROP COLUMN IF EXISTS "source_slug",
      DROP COLUMN IF EXISTS "title",
      DROP COLUMN IF EXISTS "chunk_index";
  `)
}
