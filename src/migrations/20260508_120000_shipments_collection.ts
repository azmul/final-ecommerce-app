import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "shipments" (
      "id" serial PRIMARY KEY NOT NULL,
      "shipping_name" varchar NOT NULL,
      "dhaka_point_delivery_charge" numeric DEFAULT 0,
      "dhaka_home_delivery_charge" numeric DEFAULT 0,
      "outside_dhaka_point_delivery_charge" numeric DEFAULT 0,
      "outside_dhaka_home_delivery_charge" numeric DEFAULT 0,
      "free_delivery" boolean DEFAULT false,
      "cumulative_count" numeric,
      "cumulative_charge" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "shipments_id" integer;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shipments_fk"
        FOREIGN KEY ("shipments_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "shipments_updated_at_idx" ON "shipments" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "shipments_created_at_idx" ON "shipments" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_shipments_id_idx"
      ON "payload_locked_documents_rels" USING btree ("shipments_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_shipments_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_shipments_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "shipments_id";

    DROP TABLE IF EXISTS "shipments" CASCADE;
  `)
}
