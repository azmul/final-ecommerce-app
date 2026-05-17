import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Focus Discount Product block on `pages` — carousel cards with discount %, category label, and image.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_focus_discount_product" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "heading" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_focus_discount_product_items" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "discount_percentage" numeric NOT NULL,
     "category_label" varchar NOT NULL,
     "image_id" integer NOT NULL,
     "link_url" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_focus_discount_product" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "heading" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_focus_discount_product_items" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "discount_percentage" numeric,
     "category_label" varchar,
     "image_id" integer,
     "link_url" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_focus_discount_product" ADD CONSTRAINT "pages_blocks_focus_discount_product_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_focus_discount_product_items" ADD CONSTRAINT "pages_blocks_focus_discount_product_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_focus_discount_product"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_focus_discount_product_items" ADD CONSTRAINT "pages_blocks_focus_discount_product_items_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_focus_discount_product" ADD CONSTRAINT "_pages_v_blocks_focus_discount_product_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_focus_discount_product_items" ADD CONSTRAINT "_pages_v_blocks_focus_discount_product_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_focus_discount_product"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_focus_discount_product_items" ADD CONSTRAINT "_pages_v_blocks_focus_discount_product_items_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_blocks_focus_discount_product_order_idx"
     ON "pages_blocks_focus_discount_product" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_focus_discount_product_parent_id_idx"
     ON "pages_blocks_focus_discount_product" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_focus_discount_product_path_idx"
     ON "pages_blocks_focus_discount_product" USING btree ("_path");

   CREATE INDEX IF NOT EXISTS "pages_blocks_focus_discount_product_items_order_idx"
     ON "pages_blocks_focus_discount_product_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_focus_discount_product_items_parent_id_idx"
     ON "pages_blocks_focus_discount_product_items" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_focus_discount_product_items_image_idx"
     ON "pages_blocks_focus_discount_product_items" USING btree ("image_id");

   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_focus_discount_product_order_idx"
     ON "_pages_v_blocks_focus_discount_product" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_focus_discount_product_parent_id_idx"
     ON "_pages_v_blocks_focus_discount_product" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_focus_discount_product_path_idx"
     ON "_pages_v_blocks_focus_discount_product" USING btree ("_path");

   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_focus_discount_product_items_order_idx"
     ON "_pages_v_blocks_focus_discount_product_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_focus_discount_product_items_parent_id_idx"
     ON "_pages_v_blocks_focus_discount_product_items" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_focus_discount_product_items_image_idx"
     ON "_pages_v_blocks_focus_discount_product_items" USING btree ("image_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_pages_v_blocks_focus_discount_product_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_focus_discount_product" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_focus_discount_product_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_focus_discount_product" CASCADE;
 `)
}
