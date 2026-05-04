import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Tables and enums for the notifications module (Payload collection slugs use
 * to-snake-case table names: notification-preferences → notification_preferences).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_push_subscriptions_platform" AS ENUM('web', 'mobile_web', 'native');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_product_alerts_alert_type" AS ENUM('price_drop', 'restock');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_user_notifications_kind" AS ENUM('price_drop', 'restock', 'broadcast', 'system');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_user_notifications_channels" AS ENUM('inbox', 'push');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_notification_broadcasts_status" AS ENUM('draft', 'scheduled', 'sending', 'completed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_notification_broadcasts_segment" AS ENUM('push_enabled', 'marketing_opt_in');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE TABLE IF NOT EXISTS "notification_preferences" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "push_enabled" boolean DEFAULT true,
      "price_drop_alerts" boolean DEFAULT true,
      "stock_alerts" boolean DEFAULT true,
      "order_updates" boolean DEFAULT true,
      "marketing_opt_in" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "notification_broadcasts" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "body" text NOT NULL,
      "link_url" varchar,
      "scheduled_for" timestamp(3) with time zone,
      "status" "public"."enum_notification_broadcasts_status" DEFAULT 'draft' NOT NULL,
      "segment" "public"."enum_notification_broadcasts_segment" DEFAULT 'push_enabled' NOT NULL,
      "stats_recipients" numeric DEFAULT 0,
      "last_error" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "user_notifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "kind" "public"."enum_user_notifications_kind" NOT NULL,
      "title" varchar NOT NULL,
      "body" text NOT NULL,
      "link_url" varchar,
      "product_id" integer,
      "broadcast_id" integer,
      "read_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "user_notifications_channels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "public"."enum_user_notifications_channels" NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "push_subscriptions" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "platform" "public"."enum_push_subscriptions_platform" DEFAULT 'web' NOT NULL,
      "endpoint" varchar NOT NULL,
      "p256dh" varchar,
      "auth" varchar,
      "user_agent" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "product_alerts" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "product_id" integer NOT NULL,
      "variant_id" integer,
      "alert_type" "public"."enum_product_alerts_alert_type" NOT NULL,
      "target_price" numeric,
      "active" boolean DEFAULT true,
      "fulfilled_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $payload$ BEGIN
      ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_broadcast_id_notification_broadcasts_id_fk"
        FOREIGN KEY ("broadcast_id") REFERENCES "public"."notification_broadcasts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "user_notifications_channels" ADD CONSTRAINT "user_notifications_channels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."user_notifications"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "product_alerts" ADD CONSTRAINT "product_alerts_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "product_alerts" ADD CONSTRAINT "product_alerts_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "product_alerts" ADD CONSTRAINT "product_alerts_variant_id_variants_id_fk"
        FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_idx" ON "notification_preferences" USING btree ("user_id");

    CREATE INDEX IF NOT EXISTS "notification_preferences_updated_at_idx" ON "notification_preferences" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "notification_preferences_created_at_idx" ON "notification_preferences" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "notification_broadcasts_scheduled_for_idx" ON "notification_broadcasts" USING btree ("scheduled_for");
    CREATE INDEX IF NOT EXISTS "notification_broadcasts_status_idx" ON "notification_broadcasts" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "notification_broadcasts_updated_at_idx" ON "notification_broadcasts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "notification_broadcasts_created_at_idx" ON "notification_broadcasts" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "user_notifications_user_idx" ON "user_notifications" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "user_notifications_kind_idx" ON "user_notifications" USING btree ("kind");
    CREATE INDEX IF NOT EXISTS "user_notifications_read_at_idx" ON "user_notifications" USING btree ("read_at");
    CREATE INDEX IF NOT EXISTS "user_notifications_updated_at_idx" ON "user_notifications" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "user_notifications_created_at_idx" ON "user_notifications" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "user_notifications_channels_order_idx" ON "user_notifications_channels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "user_notifications_channels_parent_idx" ON "user_notifications_channels" USING btree ("parent_id");

    CREATE INDEX IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");
    CREATE INDEX IF NOT EXISTS "push_subscriptions_updated_at_idx" ON "push_subscriptions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "push_subscriptions_created_at_idx" ON "push_subscriptions" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "product_alerts_user_idx" ON "product_alerts" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "product_alerts_product_idx" ON "product_alerts" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "product_alerts_updated_at_idx" ON "product_alerts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_alerts_created_at_idx" ON "product_alerts" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "notification_preferences_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "notification_broadcasts_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "user_notifications_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "push_subscriptions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_alerts_id" integer;

    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notification_preferences_fk"
        FOREIGN KEY ("notification_preferences_id") REFERENCES "public"."notification_preferences"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notification_broadcasts_fk"
        FOREIGN KEY ("notification_broadcasts_id") REFERENCES "public"."notification_broadcasts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_notifications_fk"
        FOREIGN KEY ("user_notifications_id") REFERENCES "public"."user_notifications"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_push_subscriptions_fk"
        FOREIGN KEY ("push_subscriptions_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_alerts_fk"
        FOREIGN KEY ("product_alerts_id") REFERENCES "public"."product_alerts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_notification_preferences_id_idx" ON "payload_locked_documents_rels" USING btree ("notification_preferences_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_notification_broadcasts_id_idx" ON "payload_locked_documents_rels" USING btree ("notification_broadcasts_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_user_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("user_notifications_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_push_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("push_subscriptions_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_alerts_id_idx" ON "payload_locked_documents_rels" USING btree ("product_alerts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_alerts_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_push_subscriptions_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_user_notifications_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_notification_broadcasts_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_notification_preferences_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_alerts_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_push_subscriptions_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_user_notifications_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_notification_broadcasts_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_notification_preferences_id_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_alerts_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "push_subscriptions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "user_notifications_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "notification_broadcasts_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "notification_preferences_id";

    DROP TABLE IF EXISTS "product_alerts" CASCADE;
    DROP TABLE IF EXISTS "push_subscriptions" CASCADE;
    DROP TABLE IF EXISTS "user_notifications_channels" CASCADE;
    DROP TABLE IF EXISTS "user_notifications" CASCADE;
    DROP TABLE IF EXISTS "notification_broadcasts" CASCADE;
    DROP TABLE IF EXISTS "notification_preferences" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_product_alerts_alert_type";
    DROP TYPE IF EXISTS "public"."enum_push_subscriptions_platform";
    DROP TYPE IF EXISTS "public"."enum_user_notifications_channels";
    DROP TYPE IF EXISTS "public"."enum_user_notifications_kind";
    DROP TYPE IF EXISTS "public"."enum_notification_broadcasts_segment";
    DROP TYPE IF EXISTS "public"."enum_notification_broadcasts_status";
  `)
}
