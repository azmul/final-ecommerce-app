import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Single image banner block on `pages`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $payload$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'pages_blocks_single_image_banner'
     ) AND EXISTS (
       SELECT 1 FROM pg_type t
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public' AND t.typname = 'pages_blocks_single_image_banner'
     ) THEN
       DROP TYPE "public"."pages_blocks_single_image_banner";
     END IF;

     IF NOT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = '_pages_v_blocks_single_image_banner'
     ) AND EXISTS (
       SELECT 1 FROM pg_type t
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public' AND t.typname = '_pages_v_blocks_single_image_banner'
     ) THEN
       DROP TYPE "public"."_pages_v_blocks_single_image_banner";
     END IF;
   END $payload$;
 `)

  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_single_image_banner" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "image_id" integer NOT NULL,
     "link" varchar,
     "block_name" varchar
   );
 `)

  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_single_image_banner" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "image_id" integer,
     "link" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );
 `)

  await db.execute(sql`
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_single_image_banner" ADD CONSTRAINT "pages_blocks_single_image_banner_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_single_image_banner" ADD CONSTRAINT "pages_blocks_single_image_banner_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_single_image_banner" ADD CONSTRAINT "_pages_v_blocks_single_image_banner_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_single_image_banner" ADD CONSTRAINT "_pages_v_blocks_single_image_banner_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_blocks_single_image_banner_order_idx"
     ON "pages_blocks_single_image_banner" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_single_image_banner_parent_id_idx"
     ON "pages_blocks_single_image_banner" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_single_image_banner_path_idx"
     ON "pages_blocks_single_image_banner" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "pages_blocks_single_image_banner_image_idx"
     ON "pages_blocks_single_image_banner" USING btree ("image_id");

   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_single_image_banner_order_idx"
     ON "_pages_v_blocks_single_image_banner" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_single_image_banner_parent_id_idx"
     ON "_pages_v_blocks_single_image_banner" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_single_image_banner_path_idx"
     ON "_pages_v_blocks_single_image_banner" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_single_image_banner_image_idx"
     ON "_pages_v_blocks_single_image_banner" USING btree ("image_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_pages_v_blocks_single_image_banner" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_single_image_banner" CASCADE;
 `)
}
