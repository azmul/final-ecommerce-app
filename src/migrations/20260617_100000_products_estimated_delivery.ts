import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "estimated_delivery" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_estimated_delivery" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "estimated_delivery";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_estimated_delivery";
  `)
}
