import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "discount_percentage" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_discount_percentage" numeric;
    ALTER TABLE "products" DROP COLUMN IF EXISTS "compare_at_price_in_u_s_d";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_compare_at_price_in_u_s_d";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_discount_percentage";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "discount_percentage";
  `)
}
