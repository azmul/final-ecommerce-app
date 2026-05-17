import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Add `users` to staff permission page enum for office staff grants */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TYPE "public"."enum_users_staff_grants_page" ADD VALUE IF NOT EXISTS 'users';
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing enum values safely
}
