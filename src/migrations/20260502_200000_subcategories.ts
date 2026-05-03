import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "subcategories" (
     "id" serial PRIMARY KEY NOT NULL,
     "title" varchar NOT NULL,
     "parent_id" integer NOT NULL,
     "generate_slug" boolean DEFAULT true,
     "slug" varchar NOT NULL,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   DO $payload$ BEGIN
     ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE UNIQUE INDEX IF NOT EXISTS "subcategories_slug_idx" ON "subcategories" USING btree ("slug");
   CREATE INDEX IF NOT EXISTS "subcategories_parent_idx" ON "subcategories" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "subcategories_updated_at_idx" ON "subcategories" USING btree ("updated_at");
   CREATE INDEX IF NOT EXISTS "subcategories_created_at_idx" ON "subcategories" USING btree ("created_at");

   ALTER TABLE "products_rels" ADD COLUMN IF NOT EXISTS "subcategories_id" integer;
   ALTER TABLE "_products_v_rels" ADD COLUMN IF NOT EXISTS "subcategories_id" integer;
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subcategories_id" integer;

   DO $payload$ BEGIN
     ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_subcategories_fk" FOREIGN KEY ("subcategories_id") REFERENCES "public"."subcategories"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_subcategories_fk" FOREIGN KEY ("subcategories_id") REFERENCES "public"."subcategories"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subcategories_fk" FOREIGN KEY ("subcategories_id") REFERENCES "public"."subcategories"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "products_rels_subcategories_id_idx" ON "products_rels" USING btree ("subcategories_id");
   CREATE INDEX IF NOT EXISTS "_products_v_rels_subcategories_id_idx" ON "_products_v_rels" USING btree ("subcategories_id");
   CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subcategories_id_idx" ON "payload_locked_documents_rels" USING btree ("subcategories_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subcategories_fk";
   DROP INDEX IF EXISTS "payload_locked_documents_rels_subcategories_id_idx";
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subcategories_id";

   ALTER TABLE "_products_v_rels" DROP CONSTRAINT IF EXISTS "_products_v_rels_subcategories_fk";
   DROP INDEX IF EXISTS "_products_v_rels_subcategories_id_idx";
   ALTER TABLE "_products_v_rels" DROP COLUMN IF EXISTS "subcategories_id";

   ALTER TABLE "products_rels" DROP CONSTRAINT IF EXISTS "products_rels_subcategories_fk";
   DROP INDEX IF EXISTS "products_rels_subcategories_id_idx";
   ALTER TABLE "products_rels" DROP COLUMN IF EXISTS "subcategories_id";

   DROP INDEX IF EXISTS "subcategories_slug_idx";
   DROP INDEX IF EXISTS "subcategories_parent_idx";
   DROP INDEX IF EXISTS "subcategories_updated_at_idx";
   DROP INDEX IF EXISTS "subcategories_created_at_idx";
   DROP TABLE IF EXISTS "subcategories" CASCADE;
 `)
}
