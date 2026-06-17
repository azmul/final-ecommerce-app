import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** Settings global: site logo upload. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "settings" (
     "id" serial PRIMARY KEY NOT NULL,
     "logo_id" integer,
     "updated_at" timestamp(3) with time zone,
     "created_at" timestamp(3) with time zone
   );

   DO $payload$ BEGIN
     ALTER TABLE "settings" ADD CONSTRAINT "settings_logo_id_media_id_fk"
       FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id")
       ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "settings_logo_idx" ON "settings" USING btree ("logo_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "settings" CASCADE;
  `)
}
