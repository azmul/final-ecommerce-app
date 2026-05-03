import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_full_name" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_phone" varchar;
    ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "customer_full_name" varchar;
    ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "customer_phone" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "transactions" DROP COLUMN IF EXISTS "customer_phone";
    ALTER TABLE "transactions" DROP COLUMN IF EXISTS "customer_full_name";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "customer_phone";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "customer_full_name";
  `)
}
