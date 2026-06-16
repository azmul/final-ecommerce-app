import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** Footer global: brand/contact fields + multi-column navigation links. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $payload$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_footer_link_columns_items_link_type') THEN
       CREATE TYPE "public"."enum_footer_link_columns_items_link_type" AS ENUM('reference', 'custom');
     END IF;
   END $payload$;

   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "description" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "address" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "phone" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "email" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "logo_id" integer;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "social_links_facebook" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "social_links_twitter" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "social_links_instagram" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "app_links_google_play" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "app_links_app_store" varchar;
   ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "copyright_text" varchar;

   DO $payload$ BEGIN
     ALTER TABLE "footer" ADD CONSTRAINT "footer_logo_id_media_id_fk"
       FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "footer_logo_idx" ON "footer" USING btree ("logo_id");

   CREATE TABLE IF NOT EXISTS "footer_link_columns" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "title" varchar NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "footer_link_columns_items" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "link_type" "enum_footer_link_columns_items_link_type" DEFAULT 'reference',
     "link_new_tab" boolean,
     "link_url" varchar,
     "link_label" varchar NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "footer_link_columns_items_rels" (
     "id" serial PRIMARY KEY NOT NULL,
     "order" integer,
     "parent_id" varchar NOT NULL,
     "path" varchar NOT NULL,
     "pages_id" integer
   );

   DO $payload$ BEGIN
     ALTER TABLE "footer_link_columns" ADD CONSTRAINT "footer_link_columns_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "footer_link_columns_items" ADD CONSTRAINT "footer_link_columns_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_link_columns"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "footer_link_columns_items_rels" ADD CONSTRAINT "footer_link_columns_items_rels_parent_fk"
       FOREIGN KEY ("parent_id") REFERENCES "public"."footer_link_columns_items"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "footer_link_columns_items_rels" ADD CONSTRAINT "footer_link_columns_items_rels_pages_fk"
       FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "footer_link_columns_order_idx" ON "footer_link_columns" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "footer_link_columns_parent_id_idx" ON "footer_link_columns" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "footer_link_columns_items_order_idx" ON "footer_link_columns_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "footer_link_columns_items_parent_id_idx" ON "footer_link_columns_items" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "footer_link_columns_items_rels_order_idx" ON "footer_link_columns_items_rels" USING btree ("order");
   CREATE INDEX IF NOT EXISTS "footer_link_columns_items_rels_parent_idx" ON "footer_link_columns_items_rels" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "footer_link_columns_items_rels_path_idx" ON "footer_link_columns_items_rels" USING btree ("path");
   CREATE INDEX IF NOT EXISTS "footer_link_columns_items_rels_pages_id_idx" ON "footer_link_columns_items_rels" USING btree ("pages_id");

   DROP TABLE IF EXISTS "footer_nav_items" CASCADE;
   DELETE FROM "footer_rels" WHERE "path" LIKE 'navItems%';
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $payload$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_footer_nav_items_link_type') THEN
       CREATE TYPE "public"."enum_footer_nav_items_link_type" AS ENUM('reference', 'custom');
     END IF;
   END $payload$;

   CREATE TABLE IF NOT EXISTS "footer_nav_items" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "link_type" "enum_footer_nav_items_link_type" DEFAULT 'reference',
     "link_new_tab" boolean,
     "link_url" varchar,
     "link_label" varchar NOT NULL
   );

   DO $payload$ BEGIN
     ALTER TABLE "footer_nav_items" ADD CONSTRAINT "footer_nav_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "footer_nav_items_order_idx" ON "footer_nav_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "footer_nav_items_parent_id_idx" ON "footer_nav_items" USING btree ("_parent_id");

   DROP TABLE IF EXISTS "footer_link_columns_items_rels" CASCADE;
   DROP TABLE IF EXISTS "footer_link_columns_items" CASCADE;
   DROP TABLE IF EXISTS "footer_link_columns" CASCADE;

   ALTER TABLE "footer" DROP CONSTRAINT IF EXISTS "footer_logo_id_media_id_fk";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "description";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "address";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "phone";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "email";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "logo_id";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "social_links_facebook";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "social_links_twitter";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "social_links_instagram";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "app_links_google_play";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "app_links_app_store";
   ALTER TABLE "footer" DROP COLUMN IF EXISTS "copyright_text";

   DROP TYPE IF EXISTS "enum_footer_link_columns_items_link_type";
 `)
}
