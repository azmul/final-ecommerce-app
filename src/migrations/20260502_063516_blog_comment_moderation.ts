import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_blog_comments_moderation_status" AS ENUM('pending', 'approved', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    ALTER TABLE "blog_comments" ADD COLUMN IF NOT EXISTS "moderation_status" "public"."enum_blog_comments_moderation_status" DEFAULT 'pending' NOT NULL;
  `)

  await db.execute(sql`
    UPDATE "blog_comments" SET "moderation_status" = 'approved' WHERE "moderation_status" IS DISTINCT FROM 'approved';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "blog_comments" DROP COLUMN IF EXISTS "moderation_status";
    DROP TYPE IF EXISTS "public"."enum_blog_comments_moderation_status";
  `)
}
