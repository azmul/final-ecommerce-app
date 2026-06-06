import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "product_embeddings_hnsw_idx"
      ON "product_embeddings" USING hnsw ("embedding" vector_cosine_ops);

    CREATE TABLE IF NOT EXISTS "ai_query_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "query_type" varchar NOT NULL,
      "query_text" text,
      "results_count" integer,
      "latency_ms" integer,
      "model" varchar,
      "user_id" integer,
      "session_id" varchar,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "ai_query_logs_query_type_idx"
      ON "ai_query_logs" USING btree ("query_type");
    CREATE INDEX IF NOT EXISTS "ai_query_logs_created_at_idx"
      ON "ai_query_logs" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "content_embeddings" (
      "id" serial PRIMARY KEY NOT NULL,
      "source_type" varchar NOT NULL,
      "source_id" integer NOT NULL,
      "chunk_text" text NOT NULL,
      "embedding" vector(1536),
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "content_embeddings_source_idx"
      ON "content_embeddings" USING btree ("source_type", "source_id");
    CREATE INDEX IF NOT EXISTS "content_embeddings_hnsw_idx"
      ON "content_embeddings" USING hnsw ("embedding" vector_cosine_ops);

    CREATE TABLE IF NOT EXISTS "product_affinity" (
      "product_id_a" integer NOT NULL,
      "product_id_b" integer NOT NULL,
      "co_count" integer NOT NULL,
      "score" numeric NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      PRIMARY KEY ("product_id_a", "product_id_b")
    );

    CREATE INDEX IF NOT EXISTS "product_affinity_a_score_idx"
      ON "product_affinity" USING btree ("product_id_a", "score" DESC);

    CREATE TABLE IF NOT EXISTS "product_image_embeddings" (
      "product_id" integer PRIMARY KEY NOT NULL,
      "image_url" text NOT NULL,
      "embedding" vector(1536),
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $payload$ BEGIN
      ALTER TABLE "product_image_embeddings" ADD CONSTRAINT "product_image_embeddings_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE INDEX IF NOT EXISTS "product_image_embeddings_hnsw_idx"
      ON "product_image_embeddings" USING hnsw ("embedding" vector_cosine_ops);

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_summary_text" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_summary_sentiment" numeric;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_summary_generated_at" timestamp(3) with time zone;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_summary_review_count_at_generation" integer;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_content_auto_generated" boolean DEFAULT false;

    CREATE TABLE IF NOT EXISTS "products_review_summary_pros" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "item" varchar
    );

    CREATE TABLE IF NOT EXISTS "products_review_summary_cons" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "item" varchar
    );

    CREATE TABLE IF NOT EXISTS "products_review_summary_common_complaints" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "item" varchar
    );

    DO $payload$ BEGIN
      ALTER TABLE "products_review_summary_pros" ADD CONSTRAINT "products_review_summary_pros_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "products_review_summary_cons" ADD CONSTRAINT "products_review_summary_cons_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "products_review_summary_common_complaints" ADD CONSTRAINT "products_review_summary_common_complaints_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "products_review_summary_common_complaints" CASCADE;
    DROP TABLE IF EXISTS "products_review_summary_cons" CASCADE;
    DROP TABLE IF EXISTS "products_review_summary_pros" CASCADE;
    ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_content_auto_generated";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "review_summary_review_count_at_generation";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "review_summary_generated_at";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "review_summary_sentiment";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "review_summary_text";
    DROP TABLE IF EXISTS "product_image_embeddings" CASCADE;
    DROP TABLE IF EXISTS "product_affinity" CASCADE;
    DROP TABLE IF EXISTS "content_embeddings" CASCADE;
    DROP TABLE IF EXISTS "ai_query_logs" CASCADE;
    DROP INDEX IF EXISTS "product_embeddings_hnsw_idx";
  `)
}
