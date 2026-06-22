import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_analytics_events_event_type' AND e.enumlabel = 'add_payment_info'
      ) THEN
        ALTER TYPE "public"."enum_analytics_events_event_type" ADD VALUE 'add_payment_info';
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_analytics_events_event_type' AND e.enumlabel = 'search'
      ) THEN
        ALTER TYPE "public"."enum_analytics_events_event_type" ADD VALUE 'search';
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_analytics_events_event_type' AND e.enumlabel = 'lead'
      ) THEN
        ALTER TYPE "public"."enum_analytics_events_event_type" ADD VALUE 'lead';
      END IF;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_analytics_events_event_type' AND e.enumlabel = 'complete_registration'
      ) THEN
        ALTER TYPE "public"."enum_analytics_events_event_type" ADD VALUE 'complete_registration';
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing enum values safely; no-op.
  await db.execute(sql`SELECT 1`)
}
