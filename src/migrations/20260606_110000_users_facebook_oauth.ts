import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "facebook_id" varchar;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "users_facebook_id_unique"
      ON "users" USING btree ("facebook_id")
      WHERE "facebook_id" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "users_facebook_id_unique";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "facebook_id";
  `)
}
