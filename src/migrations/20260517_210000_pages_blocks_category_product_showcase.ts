import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Category Product Showcase block on `pages` — category tabs with paginated product grid.
 * Category relationships use `pages_rels` / `_pages_v_rels` (`categories_id`).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_category_product_showcase" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "heading" varchar,
     "show_for_you_tab" boolean DEFAULT true,
     "for_you_label" varchar DEFAULT 'For You',
     "products_per_page" numeric DEFAULT 18,
     "sort_by" varchar DEFAULT '-updatedAt',
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_category_product_showcase" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "heading" varchar,
     "show_for_you_tab" boolean DEFAULT true,
     "for_you_label" varchar DEFAULT 'For You',
     "products_per_page" numeric,
     "sort_by" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_category_product_showcase" ADD CONSTRAINT "pages_blocks_category_product_showcase_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_category_product_showcase" ADD CONSTRAINT "_pages_v_blocks_category_product_showcase_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_blocks_category_product_showcase_order_idx"
     ON "pages_blocks_category_product_showcase" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_category_product_showcase_parent_id_idx"
     ON "pages_blocks_category_product_showcase" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_category_product_showcase_path_idx"
     ON "pages_blocks_category_product_showcase" USING btree ("_path");

   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_category_product_showcase_order_idx"
     ON "_pages_v_blocks_category_product_showcase" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_category_product_showcase_parent_id_idx"
     ON "_pages_v_blocks_category_product_showcase" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_category_product_showcase_path_idx"
     ON "_pages_v_blocks_category_product_showcase" USING btree ("_path");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_pages_v_blocks_category_product_showcase" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_category_product_showcase" CASCADE;
 `)
}
