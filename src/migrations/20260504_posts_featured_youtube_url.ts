import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "featured_youtube_url" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_featured_youtube_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "featured_youtube_url";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_featured_youtube_url";
  `)
}
