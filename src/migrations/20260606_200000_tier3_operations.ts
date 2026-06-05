import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_analytics_events_event_type" AS ENUM(
        'product_view', 'add_to_cart', 'begin_checkout', 'purchase'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_quote_requests_status" AS ENUM(
        'new', 'in_review', 'quoted', 'won', 'lost', 'closed'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "stock_locations" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar,
      "district" varchar,
      "is_default" boolean DEFAULT false,
      "active" boolean DEFAULT true,
      "internal_note" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "analytics_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "event_type" "public"."enum_analytics_events_event_type" NOT NULL,
      "session_id" varchar,
      "user_id" integer,
      "product_id" integer,
      "cart_id" integer,
      "order_id" integer,
      "metadata" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "quote_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "status" "public"."enum_quote_requests_status" DEFAULT 'new' NOT NULL,
      "product_id" integer NOT NULL,
      "quantity" numeric NOT NULL,
      "company_name" varchar NOT NULL,
      "contact_name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "phone" varchar,
      "message" varchar,
      "quoted_amount" numeric,
      "staff_note" varchar,
      "customer_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reorder_level" numeric DEFAULT 5;
    ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "reorder_level" numeric DEFAULT 5;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_reorder_level" numeric DEFAULT 5;
    ALTER TABLE "_variants_v" ADD COLUMN IF NOT EXISTS "version_reorder_level" numeric DEFAULT 5;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_inventory_by_location" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "location_id" integer,
      "quantity" numeric DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS "variants_inventory_by_location" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "location_id" integer,
      "quantity" numeric DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS "products_blocks_form_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "form_id" integer,
      "enable_intro" boolean,
      "intro_content" jsonb,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "_products_v_blocks_form_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "form_id" integer,
      "enable_intro" boolean,
      "intro_content" jsonb,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "_products_v_version_inventory_by_location" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "location_id" integer,
      "quantity" numeric DEFAULT 0,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "_variants_v_version_inventory_by_location" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "location_id" integer,
      "quantity" numeric DEFAULT 0,
      "_uuid" varchar
    );
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_cart_id_carts_id_fk"
        FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_order_id_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_customer_id_users_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "products_inventory_by_location" ADD CONSTRAINT "products_inventory_by_location_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "products_inventory_by_location" ADD CONSTRAINT "products_inventory_by_location_location_id_fk"
        FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "variants_inventory_by_location" ADD CONSTRAINT "variants_inventory_by_location_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "variants_inventory_by_location" ADD CONSTRAINT "variants_inventory_by_location_location_id_fk"
        FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "products_blocks_form_block" ADD CONSTRAINT "products_blocks_form_block_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "products_blocks_form_block" ADD CONSTRAINT "products_blocks_form_block_form_id_fk"
        FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "_products_v_blocks_form_block" ADD CONSTRAINT "_products_v_blocks_form_block_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "_products_v_blocks_form_block" ADD CONSTRAINT "_products_v_blocks_form_block_form_id_fk"
        FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "_products_v_version_inventory_by_location" ADD CONSTRAINT "_products_v_version_inventory_by_location_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "_products_v_version_inventory_by_location" ADD CONSTRAINT "_products_v_version_inventory_by_location_location_id_fk"
        FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "_variants_v_version_inventory_by_location" ADD CONSTRAINT "_variants_v_version_inventory_by_location_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_variants_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "_variants_v_version_inventory_by_location" ADD CONSTRAINT "_variants_v_version_inventory_by_location_location_id_fk"
        FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "stock_locations_slug_idx" ON "stock_locations" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events" USING btree ("event_type");
    CREATE INDEX IF NOT EXISTS "analytics_events_session_id_idx" ON "analytics_events" USING btree ("session_id");
    CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "quote_requests_status_idx" ON "quote_requests" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "quote_requests_product_idx" ON "quote_requests" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "quote_requests_created_at_idx" ON "quote_requests" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "products_inventory_by_location_parent_id_idx" ON "products_inventory_by_location" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "variants_inventory_by_location_parent_id_idx" ON "variants_inventory_by_location" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_blocks_form_block_parent_id_idx" ON "products_blocks_form_block" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_products_v_blocks_form_block_parent_id_idx" ON "_products_v_blocks_form_block" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_inventory_by_location_parent_id_idx" ON "_products_v_version_inventory_by_location" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_variants_v_version_inventory_by_location_parent_id_idx" ON "_variants_v_version_inventory_by_location" USING btree ("_parent_id");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "stock_locations_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "analytics_events_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "quote_requests_id" integer;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "quote_requests_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "analytics_events_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "stock_locations_id";

    DROP TABLE IF EXISTS "_variants_v_version_inventory_by_location";
    DROP TABLE IF EXISTS "_products_v_version_inventory_by_location";
    DROP TABLE IF EXISTS "_products_v_blocks_form_block";
    DROP TABLE IF EXISTS "products_blocks_form_block";
    DROP TABLE IF EXISTS "variants_inventory_by_location";
    DROP TABLE IF EXISTS "products_inventory_by_location";
    DROP TABLE IF EXISTS "quote_requests";
    DROP TABLE IF EXISTS "analytics_events";
    DROP TABLE IF EXISTS "stock_locations";

    ALTER TABLE "_variants_v" DROP COLUMN IF EXISTS "version_reorder_level";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_reorder_level";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "reorder_level";
    ALTER TABLE "variants" DROP COLUMN IF EXISTS "reorder_level";

    DROP TYPE IF EXISTS "public"."enum_quote_requests_status";
    DROP TYPE IF EXISTS "public"."enum_analytics_events_event_type";
  `)
}
