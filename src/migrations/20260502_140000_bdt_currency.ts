import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Enum labels added in a dedicated migration so Postgres can commit before we reference `BDT`. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_enum e
        JOIN pg_catalog.pg_type t ON e.enumtypid = t.oid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'enum_carts_currency' AND e.enumlabel = 'BDT'
      ) THEN
        ALTER TYPE "public"."enum_carts_currency" ADD VALUE 'BDT';
      END IF;
    END $payload$;
  `)
  await db.execute(sql`
    DO $payload$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_enum e
        JOIN pg_catalog.pg_type t ON e.enumtypid = t.oid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'enum_orders_currency' AND e.enumlabel = 'BDT'
      ) THEN
        ALTER TYPE "public"."enum_orders_currency" ADD VALUE 'BDT';
      END IF;
    END $payload$;
  `)
  await db.execute(sql`
    DO $payload$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_enum e
        JOIN pg_catalog.pg_type t ON e.enumtypid = t.oid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'enum_transactions_currency' AND e.enumlabel = 'BDT'
      ) THEN
        ALTER TYPE "public"."enum_transactions_currency" ADD VALUE 'BDT';
      END IF;
    END $payload$;
  `)
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // no-op: Postgres cannot drop enum labels safely here
}
