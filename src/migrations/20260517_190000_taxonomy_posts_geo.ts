import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * GEO content on categories, brands, and posts (seoContent groups + FAQ/takeaway arrays).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_ai_summary" varchar;
   ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_overview" varchar;
   ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_buying_guide" varchar;

   CREATE TABLE IF NOT EXISTS "categories_seo_content_faqs" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "question" varchar NOT NULL,
     "answer" varchar NOT NULL
   );

   DO $payload$ BEGIN
     ALTER TABLE "categories_seo_content_faqs" ADD CONSTRAINT "categories_seo_content_faqs_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "categories_seo_content_faqs_order_idx"
     ON "categories_seo_content_faqs" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "categories_seo_content_faqs_parent_id_idx"
     ON "categories_seo_content_faqs" USING btree ("_parent_id");

   ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "seo_content_ai_summary" varchar;
   ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "seo_content_overview" varchar;
   ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "seo_content_buying_guide" varchar;

   CREATE TABLE IF NOT EXISTS "brands_seo_content_faqs" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "question" varchar NOT NULL,
     "answer" varchar NOT NULL
   );

   DO $payload$ BEGIN
     ALTER TABLE "brands_seo_content_faqs" ADD CONSTRAINT "brands_seo_content_faqs_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."brands"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "brands_seo_content_faqs_order_idx"
     ON "brands_seo_content_faqs" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "brands_seo_content_faqs_parent_id_idx"
     ON "brands_seo_content_faqs" USING btree ("_parent_id");

   ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "seo_content_ai_summary" varchar;

   CREATE TABLE IF NOT EXISTS "posts_seo_content_key_takeaways" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "point" varchar
   );

   CREATE TABLE IF NOT EXISTS "posts_seo_content_faqs" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "question" varchar,
     "answer" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "posts_seo_content_key_takeaways" ADD CONSTRAINT "posts_seo_content_key_takeaways_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "posts_seo_content_faqs" ADD CONSTRAINT "posts_seo_content_faqs_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "posts_seo_content_key_takeaways_order_idx"
     ON "posts_seo_content_key_takeaways" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "posts_seo_content_key_takeaways_parent_id_idx"
     ON "posts_seo_content_key_takeaways" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "posts_seo_content_faqs_order_idx"
     ON "posts_seo_content_faqs" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "posts_seo_content_faqs_parent_id_idx"
     ON "posts_seo_content_faqs" USING btree ("_parent_id");

   ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_seo_content_ai_summary" varchar;

   CREATE TABLE IF NOT EXISTS "_posts_v_version_seo_content_key_takeaways" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "point" varchar,
     "_uuid" varchar
   );

   CREATE TABLE IF NOT EXISTS "_posts_v_version_seo_content_faqs" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "question" varchar,
     "answer" varchar,
     "_uuid" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "_posts_v_version_seo_content_key_takeaways" ADD CONSTRAINT "_posts_v_version_seo_content_key_takeaways_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_posts_v_version_seo_content_faqs" ADD CONSTRAINT "_posts_v_version_seo_content_faqs_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "_posts_v_version_seo_content_key_takeaways_order_idx"
     ON "_posts_v_version_seo_content_key_takeaways" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_posts_v_version_seo_content_key_takeaways_parent_id_idx"
     ON "_posts_v_version_seo_content_key_takeaways" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_posts_v_version_seo_content_faqs_order_idx"
     ON "_posts_v_version_seo_content_faqs" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_posts_v_version_seo_content_faqs_parent_id_idx"
     ON "_posts_v_version_seo_content_faqs" USING btree ("_parent_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_posts_v_version_seo_content_faqs" CASCADE;
   DROP TABLE IF EXISTS "_posts_v_version_seo_content_key_takeaways" CASCADE;
   ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_seo_content_ai_summary";

   DROP TABLE IF EXISTS "posts_seo_content_faqs" CASCADE;
   DROP TABLE IF EXISTS "posts_seo_content_key_takeaways" CASCADE;
   ALTER TABLE "posts" DROP COLUMN IF EXISTS "seo_content_ai_summary";

   DROP TABLE IF EXISTS "brands_seo_content_faqs" CASCADE;
   ALTER TABLE "brands" DROP COLUMN IF EXISTS "seo_content_buying_guide";
   ALTER TABLE "brands" DROP COLUMN IF EXISTS "seo_content_overview";
   ALTER TABLE "brands" DROP COLUMN IF EXISTS "seo_content_ai_summary";

   DROP TABLE IF EXISTS "categories_seo_content_faqs" CASCADE;
   ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_buying_guide";
   ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_overview";
   ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_ai_summary";
 `)
}
