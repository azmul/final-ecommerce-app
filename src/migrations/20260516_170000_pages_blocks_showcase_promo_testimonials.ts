import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Additional `pages` layout blocks (product showcase, promos, testimonials) existed in config but
 * never had SQL migrations, so prerender failed on `pages_blocks_product_showcase` and related
 * relations. Mirrors live + `_pages_v_` draft patterns used elsewhere (e.g. featured categories).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_product_showcase" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "heading" varchar NOT NULL,
     "view_all_url" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_product_showcase" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "heading" varchar,
     "view_all_url" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_two_image_promo" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "left_image_id" integer NOT NULL,
     "right_image_id" integer NOT NULL,
     "left_link" varchar NOT NULL,
     "right_link" varchar NOT NULL,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_two_image_promo" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "left_image_id" integer,
     "right_image_id" integer,
     "left_link" varchar,
     "right_link" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_promo_carousel_split" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "right_image_id" integer NOT NULL,
     "right_link" varchar NOT NULL,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_promo_carousel_split_slides" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "image_id" integer NOT NULL,
     "link" varchar NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_promo_carousel_split" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "right_image_id" integer,
     "right_link" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_promo_carousel_split_slides" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "image_id" integer,
     "link" varchar,
     "_uuid" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_testimonials" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_testimonials_items" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "quote" text NOT NULL,
     "photo_id" integer NOT NULL,
     "name" varchar NOT NULL,
     "role" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_testimonials" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_testimonials_items" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "quote" text,
     "photo_id" integer,
     "name" varchar,
     "role" varchar,
     "_uuid" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_product_showcase" ADD CONSTRAINT "pages_blocks_product_showcase_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_product_showcase" ADD CONSTRAINT "_pages_v_blocks_product_showcase_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_two_image_promo" ADD CONSTRAINT "pages_blocks_two_image_promo_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_two_image_promo" ADD CONSTRAINT "pages_blocks_two_image_promo_left_image_id_media_id_fk"
       FOREIGN KEY ("left_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_two_image_promo" ADD CONSTRAINT "pages_blocks_two_image_promo_right_image_id_media_id_fk"
       FOREIGN KEY ("right_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_two_image_promo" ADD CONSTRAINT "_pages_v_blocks_two_image_promo_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_two_image_promo" ADD CONSTRAINT "_pages_v_blocks_two_image_promo_left_image_id_media_id_fk"
       FOREIGN KEY ("left_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_two_image_promo" ADD CONSTRAINT "_pages_v_blocks_two_image_promo_right_image_id_media_id_fk"
       FOREIGN KEY ("right_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_promo_carousel_split" ADD CONSTRAINT "pages_blocks_promo_carousel_split_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_promo_carousel_split" ADD CONSTRAINT "pages_blocks_promo_carousel_split_right_image_id_media_id_fk"
       FOREIGN KEY ("right_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_promo_carousel_split_slides" ADD CONSTRAINT "pages_blocks_promo_carousel_split_slides_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_promo_carousel_split"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_promo_carousel_split_slides" ADD CONSTRAINT "pages_blocks_promo_carousel_split_slides_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_promo_carousel_split" ADD CONSTRAINT "_pages_v_blocks_promo_carousel_split_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_promo_carousel_split" ADD CONSTRAINT "_pages_v_blocks_promo_carousel_split_right_image_id_media_id_fk"
       FOREIGN KEY ("right_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_promo_carousel_split_slides" ADD CONSTRAINT "_pages_v_blocks_promo_carousel_split_slides_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_promo_carousel_split"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_promo_carousel_split_slides" ADD CONSTRAINT "_pages_v_blocks_promo_carousel_split_slides_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_photo_id_media_id_fk"
       FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_testimonials_items" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_testimonials_items" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_photo_id_media_id_fk"
       FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_blocks_product_showcase_order_idx" ON "pages_blocks_product_showcase" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_product_showcase_parent_id_idx" ON "pages_blocks_product_showcase" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_product_showcase_path_idx" ON "pages_blocks_product_showcase" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_showcase_order_idx" ON "_pages_v_blocks_product_showcase" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_showcase_parent_id_idx" ON "_pages_v_blocks_product_showcase" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_showcase_path_idx" ON "_pages_v_blocks_product_showcase" USING btree ("_path");

   CREATE INDEX IF NOT EXISTS "pages_blocks_two_image_promo_order_idx" ON "pages_blocks_two_image_promo" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_two_image_promo_parent_id_idx" ON "pages_blocks_two_image_promo" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_two_image_promo_path_idx" ON "pages_blocks_two_image_promo" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "pages_blocks_two_image_promo_left_image_idx" ON "pages_blocks_two_image_promo" USING btree ("left_image_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_two_image_promo_right_image_idx" ON "pages_blocks_two_image_promo" USING btree ("right_image_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_two_image_promo_order_idx" ON "_pages_v_blocks_two_image_promo" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_two_image_promo_parent_id_idx" ON "_pages_v_blocks_two_image_promo" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_two_image_promo_path_idx" ON "_pages_v_blocks_two_image_promo" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_two_image_promo_left_image_idx" ON "_pages_v_blocks_two_image_promo" USING btree ("left_image_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_two_image_promo_right_image_idx" ON "_pages_v_blocks_two_image_promo" USING btree ("right_image_id");

   CREATE INDEX IF NOT EXISTS "pages_blocks_promo_carousel_split_order_idx" ON "pages_blocks_promo_carousel_split" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_promo_carousel_split_parent_id_idx" ON "pages_blocks_promo_carousel_split" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_promo_carousel_split_path_idx" ON "pages_blocks_promo_carousel_split" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "pages_blocks_promo_carousel_split_right_image_idx" ON "pages_blocks_promo_carousel_split" USING btree ("right_image_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_promo_carousel_split_slides_order_idx" ON "pages_blocks_promo_carousel_split_slides" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_promo_carousel_split_slides_parent_id_idx" ON "pages_blocks_promo_carousel_split_slides" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_promo_carousel_split_slides_image_idx" ON "pages_blocks_promo_carousel_split_slides" USING btree ("image_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_promo_carousel_split_order_idx" ON "_pages_v_blocks_promo_carousel_split" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_promo_carousel_split_parent_id_idx" ON "_pages_v_blocks_promo_carousel_split" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_promo_carousel_split_path_idx" ON "_pages_v_blocks_promo_carousel_split" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_promo_carousel_split_right_image_idx" ON "_pages_v_blocks_promo_carousel_split" USING btree ("right_image_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_promo_carousel_split_slides_order_idx" ON "_pages_v_blocks_promo_carousel_split_slides" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_promo_carousel_split_slides_parent_id_idx" ON "_pages_v_blocks_promo_carousel_split_slides" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_promo_carousel_split_slides_image_idx" ON "_pages_v_blocks_promo_carousel_split_slides" USING btree ("image_id");

   CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_order_idx" ON "pages_blocks_testimonials" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_parent_id_idx" ON "pages_blocks_testimonials" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_path_idx" ON "pages_blocks_testimonials" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_items_order_idx" ON "pages_blocks_testimonials_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_items_parent_id_idx" ON "pages_blocks_testimonials_items" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_testimonials_items_photo_idx" ON "pages_blocks_testimonials_items" USING btree ("photo_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_order_idx" ON "_pages_v_blocks_testimonials" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_parent_id_idx" ON "_pages_v_blocks_testimonials" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_path_idx" ON "_pages_v_blocks_testimonials" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_items_order_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_items_parent_id_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_testimonials_items_photo_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("photo_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_pages_v_blocks_testimonials_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_testimonials" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_testimonials_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_testimonials" CASCADE;

   DROP TABLE IF EXISTS "_pages_v_blocks_promo_carousel_split_slides" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_promo_carousel_split" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_promo_carousel_split_slides" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_promo_carousel_split" CASCADE;

   DROP TABLE IF EXISTS "_pages_v_blocks_two_image_promo" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_two_image_promo" CASCADE;

   DROP TABLE IF EXISTS "_pages_v_blocks_product_showcase" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_product_showcase" CASCADE;
 `)
}
