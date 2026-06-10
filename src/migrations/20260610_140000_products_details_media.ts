import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "details_media_type" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "details_media_image_url" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "details_media_video_url" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_details_media_type" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_details_media_image_url" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_details_media_video_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "details_media_video_url";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "details_media_image_url";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "details_media_type";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_details_media_video_url";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_details_media_image_url";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_details_media_type";
  `)
}
