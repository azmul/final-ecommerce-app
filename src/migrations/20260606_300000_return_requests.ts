import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_return_requests_status" AS ENUM('pending', 'approved', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_return_requests_request_type" AS ENUM('cancel', 'return');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_return_requests_reason" AS ENUM(
        'changed_mind', 'wrong_item', 'damaged', 'not_as_described', 'missing_parts', 'other'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "return_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "status" "public"."enum_return_requests_status" DEFAULT 'pending' NOT NULL,
      "request_type" "public"."enum_return_requests_request_type" NOT NULL,
      "order_id" integer NOT NULL,
      "customer_id" integer,
      "guest_email" varchar,
      "reason" "public"."enum_return_requests_reason" NOT NULL,
      "details" varchar,
      "staff_note" varchar,
      "resolution_note" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "return_requests_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "order_item_id" varchar NOT NULL,
      "product_id" integer NOT NULL,
      "variant_id" integer,
      "quantity" numeric NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "return_requests_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customer_id_users_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "return_requests_items" ADD CONSTRAINT "return_requests_items_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."return_requests"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "return_requests_items" ADD CONSTRAINT "return_requests_items_product_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "return_requests_items" ADD CONSTRAINT "return_requests_items_variant_id_fk"
        FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "return_requests_rels" ADD CONSTRAINT "return_requests_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."return_requests"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "return_requests_rels" ADD CONSTRAINT "return_requests_rels_media_fk"
        FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "return_requests_status_idx" ON "return_requests" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "return_requests_request_type_idx" ON "return_requests" USING btree ("request_type");
    CREATE INDEX IF NOT EXISTS "return_requests_order_idx" ON "return_requests" USING btree ("order_id");
    CREATE INDEX IF NOT EXISTS "return_requests_customer_idx" ON "return_requests" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "return_requests_created_at_idx" ON "return_requests" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "return_requests_items_parent_id_idx" ON "return_requests_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "return_requests_rels_parent_idx" ON "return_requests_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "return_requests_rels_media_id_idx" ON "return_requests_rels" USING btree ("media_id");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "return_requests_id" integer;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "return_requests_id";

    DROP TABLE IF EXISTS "return_requests_rels";
    DROP TABLE IF EXISTS "return_requests_items";
    DROP TABLE IF EXISTS "return_requests";

    DROP TYPE IF EXISTS "public"."enum_return_requests_reason";
    DROP TYPE IF EXISTS "public"."enum_return_requests_request_type";
    DROP TYPE IF EXISTS "public"."enum_return_requests_status";
  `)
}
