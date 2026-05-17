import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "sales_dashboard" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar DEFAULT 'Sales Dashboard',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "sales_dashboard_id" integer;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sales_dashboard_fk"
        FOREIGN KEY ("sales_dashboard_id") REFERENCES "public"."sales_dashboard"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "sales_dashboard_updated_at_idx" ON "sales_dashboard" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "sales_dashboard_created_at_idx" ON "sales_dashboard" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_sales_dashboard_id_idx"
      ON "payload_locked_documents_rels" USING btree ("sales_dashboard_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_sales_dashboard_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_sales_dashboard_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "sales_dashboard_id";

    DROP TABLE IF EXISTS "sales_dashboard" CASCADE;
  `)
}
