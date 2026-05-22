import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** FAQ accordion block on `pages`. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_faq" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "heading" varchar,
     "subheading" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_faq_items" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "question" varchar NOT NULL,
     "answer" varchar NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_faq" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "heading" varchar,
     "subheading" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_faq_items" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "question" varchar,
     "answer" varchar,
     "_uuid" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_pages_v_blocks_faq_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_faq" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_faq_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_faq" CASCADE;
 `)
}
