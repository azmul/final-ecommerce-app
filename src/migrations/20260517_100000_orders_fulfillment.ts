import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_tracking_number" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_carrier" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_shipped_at" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_internal_note" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "fulfillment_internal_note";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "fulfillment_shipped_at";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "fulfillment_carrier";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "fulfillment_tracking_number";
  `)
}
