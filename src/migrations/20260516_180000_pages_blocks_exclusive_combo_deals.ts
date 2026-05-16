import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Exclusive combo deals block on `pages` — product rows use existing `pages_rels.products_id`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_exclusive_combo_deals" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "heading" varchar NOT NULL,
     "view_all_url" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_exclusive_combo_deals" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "heading" varchar,
     "view_all_url" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_exclusive_combo_deals" ADD CONSTRAINT "pages_blocks_exclusive_combo_deals_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_exclusive_combo_deals" ADD CONSTRAINT "_pages_v_blocks_exclusive_combo_deals_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_blocks_exclusive_combo_deals_order_idx"
     ON "pages_blocks_exclusive_combo_deals" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_exclusive_combo_deals_parent_id_idx"
     ON "pages_blocks_exclusive_combo_deals" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_exclusive_combo_deals_path_idx"
     ON "pages_blocks_exclusive_combo_deals" USING btree ("_path");

   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_exclusive_combo_deals_order_idx"
     ON "_pages_v_blocks_exclusive_combo_deals" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_exclusive_combo_deals_parent_id_idx"
     ON "_pages_v_blocks_exclusive_combo_deals" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_exclusive_combo_deals_path_idx"
     ON "_pages_v_blocks_exclusive_combo_deals" USING btree ("_path");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_pages_v_blocks_exclusive_combo_deals" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_exclusive_combo_deals" CASCADE;
 `)
}
