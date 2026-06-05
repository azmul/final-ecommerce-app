import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_id" integer;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "flash_sale_end_date" timestamp(3) with time zone;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "flash_sale_promo_code" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "size_guide_note" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ar_model_id" integer;

    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_flash_sale_end_date" timestamp(3) with time zone;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_flash_sale_promo_code" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_size_guide_note" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_ar_model_id" integer;

    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "applied_gift_card_code" varchar;
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "gift_card_id" integer;
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "gift_card_discount_amount" numeric;
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "applied_bundle_id" integer;
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "bundle_discount_amount" numeric;

    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "applied_gift_card_code" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gift_card_id" integer;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gift_card_discount_amount" numeric;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_size_guide" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "size_label" varchar,
      "chest" varchar,
      "waist" varchar,
      "hip" varchar,
      "length" varchar
    );

    CREATE TABLE IF NOT EXISTS "_products_v_version_size_guide" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "size_label" varchar,
      "chest" varchar,
      "waist" varchar,
      "hip" varchar,
      "length" varchar,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "gift_cards" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL,
      "initial_amount" numeric NOT NULL,
      "remaining_amount" numeric NOT NULL,
      "active" boolean DEFAULT true,
      "recipient_email" varchar,
      "purchaser_id" integer,
      "expires_at" timestamp(3) with time zone,
      "internal_note" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "product_bundles" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar,
      "active" boolean DEFAULT true,
      "bundle_price" numeric NOT NULL,
      "badge_label" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "product_bundles_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "variant_id" integer,
      "quantity" numeric DEFAULT 1 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "subscriptions" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "active" boolean DEFAULT true,
      "interval_days" numeric DEFAULT 30 NOT NULL,
      "next_order_at" timestamp(3) with time zone NOT NULL,
      "shipping_address_district" varchar NOT NULL,
      "shipping_address_full_address" varchar NOT NULL,
      "last_reminder_at" timestamp(3) with time zone,
      "last_order_id_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "subscriptions_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "variant_id" integer,
      "quantity" numeric DEFAULT 1 NOT NULL
    );
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_id_fk"
        FOREIGN KEY ("referred_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_ar_model_id_fk"
        FOREIGN KEY ("ar_model_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_ar_model_id_fk"
        FOREIGN KEY ("version_ar_model_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "products_size_guide" ADD CONSTRAINT "products_size_guide_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "_products_v_version_size_guide" ADD CONSTRAINT "_products_v_version_size_guide_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchaser_id_fk"
        FOREIGN KEY ("purchaser_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "product_bundles_items" ADD CONSTRAINT "product_bundles_items_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."product_bundles"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "product_bundles_items" ADD CONSTRAINT "product_bundles_items_product_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "product_bundles_items" ADD CONSTRAINT "product_bundles_items_variant_id_fk"
        FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_last_order_id_id_fk"
        FOREIGN KEY ("last_order_id_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "subscriptions_items" ADD CONSTRAINT "subscriptions_items_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "subscriptions_items" ADD CONSTRAINT "subscriptions_items_product_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "subscriptions_items" ADD CONSTRAINT "subscriptions_items_variant_id_fk"
        FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "carts" ADD CONSTRAINT "carts_gift_card_id_fk"
        FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "carts" ADD CONSTRAINT "carts_applied_bundle_id_fk"
        FOREIGN KEY ("applied_bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_gift_card_id_fk"
        FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "users_referral_code_idx" ON "users" USING btree ("referral_code");
    CREATE INDEX IF NOT EXISTS "users_referred_by_idx" ON "users" USING btree ("referred_by_id");
    CREATE INDEX IF NOT EXISTS "products_ar_model_idx" ON "products" USING btree ("ar_model_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_version_ar_model_idx" ON "_products_v" USING btree ("version_ar_model_id");
    CREATE INDEX IF NOT EXISTS "products_size_guide_order_idx" ON "products_size_guide" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_size_guide_parent_id_idx" ON "products_size_guide" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_size_guide_order_idx" ON "_products_v_version_size_guide" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_products_v_version_size_guide_parent_id_idx" ON "_products_v_version_size_guide" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "gift_cards_code_idx" ON "gift_cards" USING btree ("code");
    CREATE INDEX IF NOT EXISTS "gift_cards_purchaser_idx" ON "gift_cards" USING btree ("purchaser_id");
    CREATE INDEX IF NOT EXISTS "gift_cards_updated_at_idx" ON "gift_cards" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "gift_cards_created_at_idx" ON "gift_cards" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "product_bundles_slug_idx" ON "product_bundles" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "product_bundles_active_idx" ON "product_bundles" USING btree ("active");
    CREATE INDEX IF NOT EXISTS "product_bundles_updated_at_idx" ON "product_bundles" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_bundles_created_at_idx" ON "product_bundles" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "product_bundles_items_order_idx" ON "product_bundles_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "product_bundles_items_parent_id_idx" ON "product_bundles_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "product_bundles_items_product_idx" ON "product_bundles_items" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "product_bundles_items_variant_idx" ON "product_bundles_items" USING btree ("variant_id");
    CREATE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "subscriptions_active_idx" ON "subscriptions" USING btree ("active");
    CREATE INDEX IF NOT EXISTS "subscriptions_next_order_at_idx" ON "subscriptions" USING btree ("next_order_at");
    CREATE INDEX IF NOT EXISTS "subscriptions_last_order_id_idx" ON "subscriptions" USING btree ("last_order_id_id");
    CREATE INDEX IF NOT EXISTS "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "subscriptions_items_order_idx" ON "subscriptions_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "subscriptions_items_parent_id_idx" ON "subscriptions_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "subscriptions_items_product_idx" ON "subscriptions_items" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "subscriptions_items_variant_idx" ON "subscriptions_items" USING btree ("variant_id");
    CREATE INDEX IF NOT EXISTS "carts_gift_card_idx" ON "carts" USING btree ("gift_card_id");
    CREATE INDEX IF NOT EXISTS "carts_applied_bundle_idx" ON "carts" USING btree ("applied_bundle_id");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subscriptions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_bundles_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "gift_cards_id" integer;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscriptions_fk"
        FOREIGN KEY ("subscriptions_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_bundles_fk"
        FOREIGN KEY ("product_bundles_id") REFERENCES "public"."product_bundles"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gift_cards_fk"
        FOREIGN KEY ("gift_cards_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("subscriptions_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_bundles_id_idx" ON "payload_locked_documents_rels" USING btree ("product_bundles_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gift_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("gift_cards_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_gift_cards_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_bundles_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_subscriptions_id_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_gift_cards_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_bundles_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscriptions_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "gift_cards_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_bundles_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subscriptions_id";
  `)

  await db.execute(sql`
    ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_gift_card_id_fk";
    ALTER TABLE "carts" DROP CONSTRAINT IF EXISTS "carts_applied_bundle_id_fk";
    ALTER TABLE "carts" DROP CONSTRAINT IF EXISTS "carts_gift_card_id_fk";

    ALTER TABLE "orders" DROP COLUMN IF EXISTS "gift_card_discount_amount";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "gift_card_id";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "applied_gift_card_code";

    ALTER TABLE "carts" DROP COLUMN IF EXISTS "bundle_discount_amount";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "applied_bundle_id";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "gift_card_discount_amount";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "gift_card_id";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "applied_gift_card_code";
  `)

  await db.execute(sql`
    DROP TABLE IF EXISTS "subscriptions_items";
    DROP TABLE IF EXISTS "subscriptions";
    DROP TABLE IF EXISTS "product_bundles_items";
    DROP TABLE IF EXISTS "product_bundles";
    DROP TABLE IF EXISTS "gift_cards";
    DROP TABLE IF EXISTS "_products_v_version_size_guide";
    DROP TABLE IF EXISTS "products_size_guide";
  `)

  await db.execute(sql`
    ALTER TABLE "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_version_ar_model_id_fk";
    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_ar_model_id_fk";
    ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_referred_by_id_fk";

    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_ar_model_id";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_size_guide_note";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_flash_sale_promo_code";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_flash_sale_end_date";

    ALTER TABLE "products" DROP COLUMN IF EXISTS "ar_model_id";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "size_guide_note";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "flash_sale_promo_code";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "flash_sale_end_date";

    ALTER TABLE "users" DROP COLUMN IF EXISTS "referred_by_id";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "referral_code";
  `)
}
