import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkout_batch_id" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkout_shipment_summary" jsonb;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "orders_checkout_batch_id_idx" ON "orders" USING btree ("checkout_batch_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "orders_checkout_batch_id_idx";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "checkout_shipment_summary";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "checkout_batch_id";
  `)
}
