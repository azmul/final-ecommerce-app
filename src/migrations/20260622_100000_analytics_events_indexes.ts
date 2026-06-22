import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds indexes on the high-cardinality / frequently-filtered columns of the
 * analytics_events table (relations + created_at). This table is high-write and
 * queried by the ops dashboards over date ranges and relations; without these
 * indexes those queries sequential-scan the whole table.
 *
 * A transaction-level advisory lock serializes concurrent runners (e.g. the
 * parallel workers `next build` spawns, which each init Payload and apply
 * pending migrations). Without it, `CREATE INDEX IF NOT EXISTS` can still hit
 * the `pg_class_relname_nsp_index` uniqueness race. Each statement also uses
 * IF NOT EXISTS so the migration is safely idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(42944001)`)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "analytics_events_user_idx" ON "analytics_events" ("user_id")`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "analytics_events_product_idx" ON "analytics_events" ("product_id")`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "analytics_events_cart_idx" ON "analytics_events" ("cart_id")`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "analytics_events_order_idx" ON "analytics_events" ("order_id")`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" ("created_at")`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(42944001)`)
  await db.execute(sql`DROP INDEX IF EXISTS "analytics_events_user_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "analytics_events_product_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "analytics_events_cart_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "analytics_events_order_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "analytics_events_created_at_idx"`)
}
