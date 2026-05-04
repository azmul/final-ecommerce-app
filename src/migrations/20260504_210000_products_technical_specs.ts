import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Array field `technicalSpecs` on `products` (compare table).
 * Matches Payload/Postgres patterns: live rows use varchar `id`, draft versions use serial + `_uuid`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "products_technical_specs" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "value" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "_products_v_version_technical_specs" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "value" varchar NOT NULL,
    "_uuid" varchar
  );

  DO $$ BEGIN
    ALTER TABLE "products_technical_specs" ADD CONSTRAINT "products_technical_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  DO $$ BEGIN
    ALTER TABLE "_products_v_version_technical_specs" ADD CONSTRAINT "_products_v_version_technical_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  CREATE INDEX IF NOT EXISTS "products_technical_specs_order_idx" ON "products_technical_specs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "products_technical_specs_parent_id_idx" ON "products_technical_specs" USING btree ("_parent_id");

  CREATE INDEX IF NOT EXISTS "_products_v_version_technical_specs_order_idx" ON "_products_v_version_technical_specs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_products_v_version_technical_specs_parent_id_idx" ON "_products_v_version_technical_specs" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_products_v_version_technical_specs" CASCADE;
    DROP TABLE IF EXISTS "products_technical_specs" CASCADE;
  `)
}
