import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "content_embeddings"
      ADD COLUMN IF NOT EXISTS "source_collection" varchar,
      ADD COLUMN IF NOT EXISTS "source_url" varchar;

    CREATE INDEX IF NOT EXISTS "content_embeddings_source_url_idx"
      ON "content_embeddings" USING btree ("source_url");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "content_embeddings_source_url_idx";

    ALTER TABLE "content_embeddings"
      DROP COLUMN IF EXISTS "source_url",
      DROP COLUMN IF EXISTS "source_collection";
  `)
}
