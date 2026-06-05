import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS "product_embeddings" (
      "product_id" integer PRIMARY KEY NOT NULL,
      "search_text" text NOT NULL,
      "embedding" vector(1536),
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $payload$ BEGIN
      ALTER TABLE "product_embeddings" ADD CONSTRAINT "product_embeddings_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE INDEX IF NOT EXISTS "product_embeddings_updated_at_idx"
      ON "product_embeddings" USING btree ("updated_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "product_embeddings" CASCADE;
  `)
}
