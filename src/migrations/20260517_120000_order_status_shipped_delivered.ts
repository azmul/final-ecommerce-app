import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_orders_status' AND e.enumlabel = 'shipped'
      ) THEN
        ALTER TYPE "public"."enum_orders_status" ADD VALUE 'shipped';
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_orders_status' AND e.enumlabel = 'delivered'
      ) THEN
        ALTER TYPE "public"."enum_orders_status" ADD VALUE 'delivered';
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_orders_status_timeline_status' AND e.enumlabel = 'shipped'
      ) THEN
        ALTER TYPE "public"."enum_orders_status_timeline_status" ADD VALUE 'shipped';
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_orders_status_timeline_status' AND e.enumlabel = 'delivered'
      ) THEN
        ALTER TYPE "public"."enum_orders_status_timeline_status" ADD VALUE 'delivered';
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing enum values safely; no-op.
  await db.execute(sql`SELECT 1`)
}
