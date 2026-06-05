import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_return_requests_financial_status" AS ENUM(
        'restocked_only', 'refunded', 'manual_refund_required'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    ALTER TABLE "return_requests" ADD COLUMN IF NOT EXISTS "financial_status"
      "public"."enum_return_requests_financial_status";
    ALTER TABLE "return_requests" ADD COLUMN IF NOT EXISTS "refund_amount" numeric;
    ALTER TABLE "return_requests" ADD COLUMN IF NOT EXISTS "stripe_refund_id" varchar;
    ALTER TABLE "return_requests" ADD COLUMN IF NOT EXISTS "restocked_at"
      timestamp(3) with time zone;
    ALTER TABLE "return_requests" ADD COLUMN IF NOT EXISTS "financial_processed_at"
      timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "financial_processed_at";
    ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "restocked_at";
    ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "stripe_refund_id";
    ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "refund_amount";
    ALTER TABLE "return_requests" DROP COLUMN IF EXISTS "financial_status";

    DROP TYPE IF EXISTS "public"."enum_return_requests_financial_status";
  `)
}
