import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds missing `_uuid` on versioned Focus Discount Product array items.
 * Payload expects this column when loading draft page versions.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_focus_discount_product_items"
      ADD COLUMN IF NOT EXISTS "_uuid" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_focus_discount_product_items"
      DROP COLUMN IF EXISTS "_uuid";
  `)
}
