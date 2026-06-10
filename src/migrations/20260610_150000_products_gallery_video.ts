import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_gallery" ADD COLUMN IF NOT EXISTS "media_type" varchar DEFAULT 'image';
    ALTER TABLE "products_gallery" ADD COLUMN IF NOT EXISTS "video_url" varchar;
    ALTER TABLE "_products_v_version_gallery" ADD COLUMN IF NOT EXISTS "media_type" varchar DEFAULT 'image';
    ALTER TABLE "_products_v_version_gallery" ADD COLUMN IF NOT EXISTS "video_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_gallery" DROP COLUMN IF EXISTS "video_url";
    ALTER TABLE "products_gallery" DROP COLUMN IF EXISTS "media_type";
    ALTER TABLE "_products_v_version_gallery" DROP COLUMN IF EXISTS "video_url";
    ALTER TABLE "_products_v_version_gallery" DROP COLUMN IF EXISTS "media_type";
  `)
}
