import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * The `brands` collection and `products.brand` were added in app code but never shipped in an
 * earlier SQL migration, so fresh migrated databases had no `brands` table (build/prerender fails).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "brands" (
     "id" serial PRIMARY KEY NOT NULL,
     "title" varchar NOT NULL,
     "description" varchar,
     "image_id" integer,
     "generate_slug" boolean DEFAULT true,
     "slug" varchar NOT NULL,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   DO $payload$ BEGIN
     ALTER TABLE "brands" ADD CONSTRAINT "brands_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE UNIQUE INDEX IF NOT EXISTS "brands_slug_idx" ON "brands" USING btree ("slug");
   CREATE INDEX IF NOT EXISTS "brands_image_idx" ON "brands" USING btree ("image_id");
   CREATE INDEX IF NOT EXISTS "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
   CREATE INDEX IF NOT EXISTS "brands_created_at_idx" ON "brands" USING btree ("created_at");

   ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand_id" integer;
   ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_brand_id" integer;

   DO $payload$ BEGIN
     ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk"
       FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk"
       FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products" USING btree ("brand_id");
   CREATE INDEX IF NOT EXISTS "_products_v_version_version_brand_idx" ON "_products_v" USING btree ("version_brand_id");

   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "brands_id" integer;

   DO $payload$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk"
       FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id")
       ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_brands_id_idx"
     ON "payload_locked_documents_rels" USING btree ("brands_id");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_brands_fk";
   DROP INDEX IF EXISTS "payload_locked_documents_rels_brands_id_idx";
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "brands_id";

   DROP INDEX IF EXISTS "_products_v_version_version_brand_idx";
   ALTER TABLE "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_version_brand_id_brands_id_fk";
   ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_brand_id";

   DROP INDEX IF EXISTS "products_brand_idx";
   ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_brand_id_brands_id_fk";
   ALTER TABLE "products" DROP COLUMN IF EXISTS "brand_id";

   DROP INDEX IF EXISTS "brands_created_at_idx";
   DROP INDEX IF EXISTS "brands_updated_at_idx";
   DROP INDEX IF EXISTS "brands_image_idx";
   DROP INDEX IF EXISTS "brands_slug_idx";
   ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "brands_image_id_media_id_fk";
   DROP TABLE IF EXISTS "brands";
 `)
}
