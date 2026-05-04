import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_promo_codes_discount_type" AS ENUM('percentage', 'fixed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "promo_codes" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL,
      "internal_label" varchar,
      "active" boolean DEFAULT true,
      "valid_from" timestamp(3) with time zone,
      "valid_until" timestamp(3) with time zone,
      "discount_type" "public"."enum_promo_codes_discount_type" NOT NULL,
      "discount_percentage" numeric,
      "discount_fixed_amount" numeric,
      "max_discount_amount" numeric,
      "min_order_subtotal" numeric,
      "max_redemptions_total" numeric,
      "max_redemptions_per_user" numeric,
      "times_redeemed" numeric DEFAULT 0,
      "first_time_customers_only" boolean DEFAULT false,
      "allowed_email_domains" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "promo_codes_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer,
      "categories_id" integer
    );
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "promo_codes_rels" ADD CONSTRAINT "promo_codes_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "promo_codes_rels" ADD CONSTRAINT "promo_codes_rels_products_fk"
        FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "promo_codes_rels" ADD CONSTRAINT "promo_codes_rels_categories_fk"
        FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "promo_codes_id" integer;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promo_codes_fk"
        FOREIGN KEY ("promo_codes_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_unique" ON "promo_codes" USING btree ("code");
    CREATE INDEX IF NOT EXISTS "promo_codes_updated_at_idx" ON "promo_codes" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "promo_codes_created_at_idx" ON "promo_codes" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "promo_codes_rels_order_idx" ON "promo_codes_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "promo_codes_rels_parent_idx" ON "promo_codes_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "promo_codes_rels_path_idx" ON "promo_codes_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "promo_codes_rels_products_id_idx" ON "promo_codes_rels" USING btree ("products_id");
    CREATE INDEX IF NOT EXISTS "promo_codes_rels_categories_id_idx" ON "promo_codes_rels" USING btree ("categories_id");

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_promo_codes_id_idx"
      ON "payload_locked_documents_rels" USING btree ("promo_codes_id");
  `)

  await db.execute(sql`
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "applied_promo_code" varchar;
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "promo_code_id" integer;
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "promo_discount_amount" numeric;
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "subtotal_before_discount" numeric;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "carts" ADD CONSTRAINT "carts_promo_code_id_promo_codes_id_fk"
        FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "carts_applied_promo_code_idx" ON "carts" USING btree ("applied_promo_code");
    CREATE INDEX IF NOT EXISTS "carts_promo_code_id_idx" ON "carts" USING btree ("promo_code_id");
  `)

  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkout_cart_id" integer;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "applied_promo_code" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promo_code_id" integer;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promo_discount_amount" numeric;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal_before_discount" numeric;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_cart_id_carts_id_fk"
        FOREIGN KEY ("checkout_cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_promo_code_id_promo_codes_id_fk"
        FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "orders_checkout_cart_id_idx" ON "orders" USING btree ("checkout_cart_id");
    CREATE INDEX IF NOT EXISTS "orders_promo_code_id_idx" ON "orders" USING btree ("promo_code_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_promo_code_id_promo_codes_id_fk";
    ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_checkout_cart_id_carts_id_fk";
    DROP INDEX IF EXISTS "orders_promo_code_id_idx";
    DROP INDEX IF EXISTS "orders_checkout_cart_id_idx";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "subtotal_before_discount";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "promo_discount_amount";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "promo_code_id";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "applied_promo_code";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "checkout_cart_id";

    ALTER TABLE "carts" DROP CONSTRAINT IF EXISTS "carts_promo_code_id_promo_codes_id_fk";
    DROP INDEX IF EXISTS "carts_promo_code_id_idx";
    DROP INDEX IF EXISTS "carts_applied_promo_code_idx";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "subtotal_before_discount";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "promo_discount_amount";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "promo_code_id";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "applied_promo_code";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_promo_codes_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_promo_codes_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "promo_codes_id";

    DROP TABLE IF EXISTS "promo_codes_rels" CASCADE;
    DROP TABLE IF EXISTS "promo_codes" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_promo_codes_discount_type";
  `)
}
