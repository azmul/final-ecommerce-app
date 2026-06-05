import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_loyalty_transactions_type" AS ENUM('earn', 'redeem');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_product_questions_status" AS ENUM('pending', 'answered');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loyalty_points" numeric DEFAULT 0;

    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "applied_loyalty_points" numeric;
    ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "loyalty_discount_amount" numeric;

    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "applied_loyalty_points" numeric;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "loyalty_discount_amount" numeric;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "loyalty_points_earned" numeric;

    ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "sms_order_updates" boolean DEFAULT true;
    ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "whatsapp_order_updates" boolean DEFAULT false;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "type" "public"."enum_loyalty_transactions_type" NOT NULL,
      "points" numeric NOT NULL,
      "order_id" integer,
      "description" varchar NOT NULL,
      "balance_after" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "recently_viewed" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "product_id" integer NOT NULL,
      "viewed_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "product_questions" (
      "id" serial PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "author_id" integer NOT NULL,
      "asker_display_name" varchar NOT NULL,
      "question" varchar NOT NULL,
      "answer" varchar,
      "status" "public"."enum_product_questions_status" DEFAULT 'pending' NOT NULL,
      "answered_at" timestamp(3) with time zone,
      "staff_note" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_product_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_product_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_author_id_fk"
        FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "loyalty_transactions_user_idx" ON "loyalty_transactions" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "loyalty_transactions_type_idx" ON "loyalty_transactions" USING btree ("type");
    CREATE INDEX IF NOT EXISTS "recently_viewed_user_idx" ON "recently_viewed" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "recently_viewed_product_idx" ON "recently_viewed" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "product_questions_product_idx" ON "product_questions" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "product_questions_status_idx" ON "product_questions" USING btree ("status");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "loyalty_transactions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "recently_viewed_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_questions_id" integer;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_questions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "recently_viewed_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "loyalty_transactions_id";

    DROP TABLE IF EXISTS "product_questions";
    DROP TABLE IF EXISTS "recently_viewed";
    DROP TABLE IF EXISTS "loyalty_transactions";

    ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "whatsapp_order_updates";
    ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "sms_order_updates";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "loyalty_points_earned";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "loyalty_discount_amount";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "applied_loyalty_points";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "loyalty_discount_amount";
    ALTER TABLE "carts" DROP COLUMN IF EXISTS "applied_loyalty_points";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "loyalty_points";

    DROP TYPE IF EXISTS "public"."enum_product_questions_status";
    DROP TYPE IF EXISTS "public"."enum_loyalty_transactions_type";
  `)
}
