import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Brands carousel block on `pages` — tables were never added to the migration chain (only existed
 * after dev push), so production builds failed when querying `pages_blocks_brands_carousel`.
 * Block `hasMany` brand rows live in `pages_rels` / `_pages_v_rels` (`brands_id`), same pattern as
 * featured categories / top-selling products.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_brands_carousel" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "heading" varchar DEFAULT 'Our Brands',
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_brands_carousel" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "heading" varchar DEFAULT 'Our Brands',
     "_uuid" varchar,
     "block_name" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_brands_carousel" ADD CONSTRAINT "pages_blocks_brands_carousel_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_brands_carousel" ADD CONSTRAINT "_pages_v_blocks_brands_carousel_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_blocks_brands_carousel_order_idx"
     ON "pages_blocks_brands_carousel" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_brands_carousel_parent_id_idx"
     ON "pages_blocks_brands_carousel" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_brands_carousel_path_idx"
     ON "pages_blocks_brands_carousel" USING btree ("_path");

   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_brands_carousel_order_idx"
     ON "_pages_v_blocks_brands_carousel" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_brands_carousel_parent_id_idx"
     ON "_pages_v_blocks_brands_carousel" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_brands_carousel_path_idx"
     ON "_pages_v_blocks_brands_carousel" USING btree ("_path");

   ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "brands_id" integer;
   ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "brands_id" integer;

   DO $payload$ BEGIN
     ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_brands_fk"
       FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_brands_fk"
       FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_rels_brands_id_idx" ON "pages_rels" USING btree ("brands_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_rels_brands_id_idx" ON "_pages_v_rels" USING btree ("brands_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_brands_fk";
   DROP INDEX IF EXISTS "pages_rels_brands_id_idx";
   ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "brands_id";

   ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS "_pages_v_rels_brands_fk";
   DROP INDEX IF EXISTS "_pages_v_rels_brands_id_idx";
   ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "brands_id";

   DROP TABLE IF EXISTS "_pages_v_blocks_brands_carousel" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_brands_carousel" CASCADE;
 `)
}
