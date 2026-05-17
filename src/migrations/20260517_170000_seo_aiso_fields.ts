import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * SEO / AISO schema added in app code (categories & brands meta, products seoContent, posts contentType).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $payload$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_posts_content_type') THEN
       CREATE TYPE "public"."enum_posts_content_type" AS ENUM(
         'article', 'buying-guide', 'comparison', 'how-to', 'faq', 'trend'
       );
     END IF;
   END $payload$;

   DO $payload$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__posts_v_version_content_type') THEN
       CREATE TYPE "public"."enum__posts_v_version_content_type" AS ENUM(
         'article', 'buying-guide', 'comparison', 'how-to', 'faq', 'trend'
       );
     END IF;
   END $payload$;

   ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_title" varchar;
   ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_image_id" integer;
   ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_description" varchar;

   DO $payload$ BEGIN
     ALTER TABLE "categories" ADD CONSTRAINT "categories_meta_image_id_media_id_fk"
       FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "categories_meta_meta_image_idx"
     ON "categories" USING btree ("meta_image_id");

   ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "meta_title" varchar;
   ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "meta_image_id" integer;
   ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "meta_description" varchar;

   DO $payload$ BEGIN
     ALTER TABLE "brands" ADD CONSTRAINT "brands_meta_image_id_media_id_fk"
       FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "brands_meta_meta_image_idx"
     ON "brands" USING btree ("meta_image_id");

   ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "content_type" "enum_posts_content_type" DEFAULT 'article';
   ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_content_type" "enum__posts_v_version_content_type" DEFAULT 'article';

   ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_content_ai_summary" varchar;
   ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_content_why_choose_this" varchar;
   ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_content_usage_info" varchar;
   ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_content_shipping_returns_note" varchar;

   CREATE TABLE IF NOT EXISTS "products_seo_content_key_features" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "feature" varchar
   );

   CREATE TABLE IF NOT EXISTS "products_seo_content_faqs" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "question" varchar,
     "answer" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "products_seo_content_key_features" ADD CONSTRAINT "products_seo_content_key_features_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "products_seo_content_faqs" ADD CONSTRAINT "products_seo_content_faqs_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "products_seo_content_key_features_order_idx"
     ON "products_seo_content_key_features" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "products_seo_content_key_features_parent_id_idx"
     ON "products_seo_content_key_features" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "products_seo_content_faqs_order_idx"
     ON "products_seo_content_faqs" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "products_seo_content_faqs_parent_id_idx"
     ON "products_seo_content_faqs" USING btree ("_parent_id");

   ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_seo_content_ai_summary" varchar;
   ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_seo_content_why_choose_this" varchar;
   ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_seo_content_usage_info" varchar;
   ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_seo_content_shipping_returns_note" varchar;

   CREATE TABLE IF NOT EXISTS "_products_v_version_seo_content_key_features" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "feature" varchar,
     "_uuid" varchar
   );

   CREATE TABLE IF NOT EXISTS "_products_v_version_seo_content_faqs" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "question" varchar,
     "answer" varchar,
     "_uuid" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "_products_v_version_seo_content_key_features" ADD CONSTRAINT "_products_v_version_seo_content_key_features_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_products_v_version_seo_content_faqs" ADD CONSTRAINT "_products_v_version_seo_content_faqs_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "_products_v_version_seo_content_key_features_order_idx"
     ON "_products_v_version_seo_content_key_features" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_products_v_version_seo_content_key_features_parent_id_idx"
     ON "_products_v_version_seo_content_key_features" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_products_v_version_seo_content_faqs_order_idx"
     ON "_products_v_version_seo_content_faqs" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_products_v_version_seo_content_faqs_parent_id_idx"
     ON "_products_v_version_seo_content_faqs" USING btree ("_parent_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_products_v_version_seo_content_faqs" CASCADE;
   DROP TABLE IF EXISTS "_products_v_version_seo_content_key_features" CASCADE;

   ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_seo_content_shipping_returns_note";
   ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_seo_content_usage_info";
   ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_seo_content_why_choose_this";
   ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_seo_content_ai_summary";

   DROP TABLE IF EXISTS "products_seo_content_faqs" CASCADE;
   DROP TABLE IF EXISTS "products_seo_content_key_features" CASCADE;

   ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_content_shipping_returns_note";
   ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_content_usage_info";
   ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_content_why_choose_this";
   ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_content_ai_summary";

   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_content_type";
   ALTER TABLE "posts" DROP COLUMN IF EXISTS "content_type";

   DROP INDEX IF EXISTS "brands_meta_meta_image_idx";
   ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "brands_meta_image_id_media_id_fk";
   ALTER TABLE "brands" DROP COLUMN IF EXISTS "meta_description";
   ALTER TABLE "brands" DROP COLUMN IF EXISTS "meta_image_id";
   ALTER TABLE "brands" DROP COLUMN IF EXISTS "meta_title";

   DROP INDEX IF EXISTS "categories_meta_meta_image_idx";
   ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_meta_image_id_media_id_fk";
   ALTER TABLE "categories" DROP COLUMN IF EXISTS "meta_description";
   ALTER TABLE "categories" DROP COLUMN IF EXISTS "meta_image_id";
   ALTER TABLE "categories" DROP COLUMN IF EXISTS "meta_title";

   DROP TYPE IF EXISTS "public"."enum__posts_v_version_content_type";
   DROP TYPE IF EXISTS "public"."enum_posts_content_type";
 `)
}
