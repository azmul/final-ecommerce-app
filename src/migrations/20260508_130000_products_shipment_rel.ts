import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shipment_id" integer;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_shipment_id" integer;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_shipment_id_shipments_id_fk"
        FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_shipment_id_shipments_id_fk"
        FOREIGN KEY ("version_shipment_id") REFERENCES "public"."shipments"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_shipment_idx" ON "products" USING btree ("shipment_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_version_shipment_idx" ON "_products_v" USING btree ("version_shipment_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_version_shipment_id_shipments_id_fk";
    DROP INDEX IF EXISTS "_products_v_version_version_shipment_idx";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_shipment_id";

    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_shipment_id_shipments_id_fk";
    DROP INDEX IF EXISTS "products_shipment_idx";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "shipment_id";
  `)
}
