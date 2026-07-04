import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds Products.identifiers.sku — a dedicated SKU used by Product JSON-LD,
 * the Google Merchant feed, and the AI product feed (falls back to slug when
 * empty). Guarded with IF NOT EXISTS so the migration is idempotent, matching
 * the surrounding migrations.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(42962302)`)

  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "identifiers_sku" varchar;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_products_v') THEN
        ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_identifiers_sku" varchar;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "identifiers_sku";
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_products_v') THEN
        ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_identifiers_sku";
      END IF;
    END $$;
  `)
}
