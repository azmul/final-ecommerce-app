import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_product_reviews_moderation_status" AS ENUM('pending', 'approved', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "product_reviews" (
      "id" serial PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "author_id" integer NOT NULL,
      "reviewer_display_name" varchar NOT NULL DEFAULT 'Customer',
      "rating" integer NOT NULL,
      "title" varchar,
      "body" varchar(2000) NOT NULL,
      "verified_purchase" boolean DEFAULT false NOT NULL,
      "moderation_status" "public"."enum_product_reviews_moderation_status" DEFAULT 'pending' NOT NULL,
      "moderator_note" varchar(2000),
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT product_reviews_rating_check CHECK ("rating" >= 1 AND "rating" <= 5)
    );
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_author_id_users_id_fk"
        FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_reviews_id" integer;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_reviews_fk"
        FOREIGN KEY ("product_reviews_id") REFERENCES "public"."product_reviews"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_product_id_author_id_unique"
      ON "product_reviews" USING btree ("product_id", "author_id");
    CREATE INDEX IF NOT EXISTS "product_reviews_product_id_idx" ON "product_reviews" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "product_reviews_author_id_idx" ON "product_reviews" USING btree ("author_id");
    CREATE INDEX IF NOT EXISTS "product_reviews_moderation_status_idx" ON "product_reviews" USING btree ("moderation_status");
    CREATE INDEX IF NOT EXISTS "product_reviews_updated_at_idx" ON "product_reviews" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_reviews_created_at_idx" ON "product_reviews" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("product_reviews_id");
  `)

  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_average_rating" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_review_average_rating" numeric;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_count" numeric DEFAULT 0;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_review_count" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_reviews_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_reviews_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_reviews_id";

    DROP TABLE IF EXISTS "product_reviews" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_product_reviews_moderation_status";

    ALTER TABLE "products" DROP COLUMN IF EXISTS "review_average_rating";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_review_average_rating";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "review_count";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_review_count";
  `)
}
