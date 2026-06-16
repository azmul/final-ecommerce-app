import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** Feature gap closure: compare lists, checkout notes, gift cards, reviews, reservations, audit logs. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "compare_lists" (
     "id" serial PRIMARY KEY NOT NULL,
     "customer_id" integer NOT NULL,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "compare_lists_rels" (
     "id" serial PRIMARY KEY NOT NULL,
     "order" integer,
     "parent_id" integer NOT NULL,
     "path" varchar NOT NULL,
     "products_id" integer
   );

   DO $payload$ BEGIN
     ALTER TABLE "compare_lists" ADD CONSTRAINT "compare_lists_customer_id_users_id_fk"
       FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE UNIQUE INDEX IF NOT EXISTS "compare_lists_customer_idx" ON "compare_lists" USING btree ("customer_id");

   DO $payload$ BEGIN
     ALTER TABLE "compare_lists_rels" ADD CONSTRAINT "compare_lists_rels_parent_fk"
       FOREIGN KEY ("parent_id") REFERENCES "public"."compare_lists"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "compare_lists_rels" ADD CONSTRAINT "compare_lists_rels_products_fk"
       FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "customer_note" varchar;
   ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "gift_message" varchar;
   ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "gift_card_purchase_amount" numeric;
   ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "gift_card_recipient_email" varchar;
   ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "issued_gift_card_id" integer;

   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_note" varchar;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gift_message" varchar;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "issued_gift_card_id" integer;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "issued_gift_card_code" varchar;
   ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "preferred_delivery_date" timestamp(3) with time zone;
   ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "delivery_time_slot" varchar;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "preferred_delivery_date" timestamp(3) with time zone;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_time_slot" varchar;

   ALTER TABLE "product_reviews" ADD COLUMN IF NOT EXISTS "helpful_count" numeric DEFAULT 0;

   CREATE TABLE IF NOT EXISTS "product_reviews_photos" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "photo_id" integer
   );

   DO $payload$ BEGIN
     ALTER TABLE "product_reviews_photos" ADD CONSTRAINT "product_reviews_photos_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."product_reviews"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "product_reviews_photos" ADD CONSTRAINT "product_reviews_photos_photo_id_media_id_fk"
       FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE TABLE IF NOT EXISTS "inventory_reservations" (
     "id" serial PRIMARY KEY NOT NULL,
     "cart_id" integer NOT NULL,
     "product_id" integer NOT NULL,
     "variant_id" integer,
     "quantity" numeric NOT NULL,
     "expires_at" timestamp(3) with time zone NOT NULL,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   CREATE INDEX IF NOT EXISTS "inventory_reservations_expires_at_idx" ON "inventory_reservations" USING btree ("expires_at");
   CREATE INDEX IF NOT EXISTS "inventory_reservations_cart_idx" ON "inventory_reservations" USING btree ("cart_id");
   CREATE INDEX IF NOT EXISTS "inventory_reservations_product_idx" ON "inventory_reservations" USING btree ("product_id");

   CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
     "id" serial PRIMARY KEY NOT NULL,
     "action" varchar NOT NULL,
     "collection" varchar NOT NULL,
     "document_id" varchar,
     "actor_id" integer,
     "summary" varchar,
     "metadata" jsonb,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   CREATE INDEX IF NOT EXISTS "admin_audit_logs_collection_idx" ON "admin_audit_logs" USING btree ("collection");
   CREATE INDEX IF NOT EXISTS "admin_audit_logs_document_id_idx" ON "admin_audit_logs" USING btree ("document_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "admin_audit_logs" CASCADE;
   DROP TABLE IF EXISTS "inventory_reservations" CASCADE;
   DROP TABLE IF EXISTS "product_reviews_photos" CASCADE;
   ALTER TABLE "product_reviews" DROP COLUMN IF EXISTS "helpful_count";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_time_slot";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "preferred_delivery_date";
   ALTER TABLE "carts" DROP COLUMN IF EXISTS "delivery_time_slot";
   ALTER TABLE "carts" DROP COLUMN IF EXISTS "preferred_delivery_date";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "issued_gift_card_code";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "issued_gift_card_id";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "gift_message";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "customer_note";
   ALTER TABLE "carts" DROP COLUMN IF EXISTS "issued_gift_card_id";
   ALTER TABLE "carts" DROP COLUMN IF EXISTS "gift_card_recipient_email";
   ALTER TABLE "carts" DROP COLUMN IF EXISTS "gift_card_purchase_amount";
   ALTER TABLE "carts" DROP COLUMN IF EXISTS "gift_message";
   ALTER TABLE "carts" DROP COLUMN IF EXISTS "customer_note";
   DROP TABLE IF EXISTS "compare_lists_rels" CASCADE;
   DROP TABLE IF EXISTS "compare_lists" CASCADE;
  `)
}
