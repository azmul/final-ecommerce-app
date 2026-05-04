import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "price_previous" numeric;
    ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "price_now" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "user_notifications" DROP COLUMN IF EXISTS "price_previous";
    ALTER TABLE "user_notifications" DROP COLUMN IF EXISTS "price_now";
  `)
}
