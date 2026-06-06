import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_orders_risk_assessment_risk_level" AS ENUM('low', 'medium', 'high');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_orders_risk_assessment_risk_review_status" AS ENUM(
        'pending', 'cleared', 'confirmed_fraud'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_users_risk_assessment_risk_level" AS ENUM('low', 'medium', 'high');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_users_risk_assessment_risk_review_status" AS ENUM(
        'pending', 'cleared', 'confirmed_fraud'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_score" numeric DEFAULT 0;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_level" "public"."enum_orders_risk_assessment_risk_level" DEFAULT 'low';
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_review_status" "public"."enum_orders_risk_assessment_risk_review_status" DEFAULT 'cleared';
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_reviewed_at" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_reviewed_by_id" integer;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_captured_ip" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_captured_user_agent" varchar;

    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_score" numeric DEFAULT 0;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_level" "public"."enum_users_risk_assessment_risk_level" DEFAULT 'low';
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_review_status" "public"."enum_users_risk_assessment_risk_review_status" DEFAULT 'cleared';
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_reviewed_at" timestamp(3) with time zone;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_reviewed_by_id" integer;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_captured_ip" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "risk_assessment_risk_captured_user_agent" varchar;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "orders_risk_assessment_risk_flags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "flag" varchar NOT NULL,
      "weight" numeric NOT NULL,
      "detail" varchar
    );

    CREATE TABLE IF NOT EXISTS "users_risk_assessment_risk_flags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "flag" varchar NOT NULL,
      "weight" numeric NOT NULL,
      "detail" varchar
    );
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_risk_assessment_risk_reviewed_by_id_users_id_fk"
        FOREIGN KEY ("risk_assessment_risk_reviewed_by_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "users" ADD CONSTRAINT "users_risk_assessment_risk_reviewed_by_id_users_id_fk"
        FOREIGN KEY ("risk_assessment_risk_reviewed_by_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "orders_risk_assessment_risk_flags" ADD CONSTRAINT "orders_risk_assessment_risk_flags_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "users_risk_assessment_risk_flags" ADD CONSTRAINT "users_risk_assessment_risk_flags_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "orders_risk_assessment_risk_flags";
    DROP TABLE IF EXISTS "users_risk_assessment_risk_flags";

    ALTER TABLE "orders" DROP COLUMN IF EXISTS "risk_assessment_risk_captured_user_agent";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "risk_assessment_risk_captured_ip";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "risk_assessment_risk_reviewed_by_id";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "risk_assessment_risk_reviewed_at";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "risk_assessment_risk_review_status";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "risk_assessment_risk_level";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "risk_assessment_risk_score";

    ALTER TABLE "users" DROP COLUMN IF EXISTS "risk_assessment_risk_captured_user_agent";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "risk_assessment_risk_captured_ip";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "risk_assessment_risk_reviewed_by_id";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "risk_assessment_risk_reviewed_at";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "risk_assessment_risk_review_status";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "risk_assessment_risk_level";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "risk_assessment_risk_score";

    DROP TYPE IF EXISTS "public"."enum_orders_risk_assessment_risk_level";
    DROP TYPE IF EXISTS "public"."enum_orders_risk_assessment_risk_review_status";
    DROP TYPE IF EXISTS "public"."enum_users_risk_assessment_risk_level";
    DROP TYPE IF EXISTS "public"."enum_users_risk_assessment_risk_review_status";
  `)
}
