import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payload maps relationship field `promoCode` → column `promo_code_id`.
 * An earlier migration used `applied_promo_code_id`, which Drizzle then queried as
 * `applied_promo_code_id_id` when the field was misnamed `appliedPromoCodeId`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $migrate$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'carts' AND column_name = 'applied_promo_code_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'carts' AND column_name = 'promo_code_id'
      ) THEN
        ALTER TABLE "public"."carts" DROP CONSTRAINT IF EXISTS "carts_applied_promo_code_id_promo_codes_id_fk";
        DROP INDEX IF EXISTS "public"."carts_applied_promo_code_id_idx";
        ALTER TABLE "public"."carts" RENAME COLUMN "applied_promo_code_id" TO "promo_code_id";
        ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_promo_code_id_promo_codes_id_fk"
          FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
        CREATE INDEX IF NOT EXISTS "carts_promo_code_id_idx" ON "public"."carts" USING btree ("promo_code_id");
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'applied_promo_code_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'promo_code_id'
      ) THEN
        ALTER TABLE "public"."orders" DROP CONSTRAINT IF EXISTS "orders_applied_promo_code_id_promo_codes_id_fk";
        DROP INDEX IF EXISTS "public"."orders_applied_promo_code_id_idx";
        ALTER TABLE "public"."orders" RENAME COLUMN "applied_promo_code_id" TO "promo_code_id";
        ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_promo_code_id_promo_codes_id_fk"
          FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
        CREATE INDEX IF NOT EXISTS "orders_promo_code_id_idx" ON "public"."orders" USING btree ("promo_code_id");
      END IF;
    END
    $migrate$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $migrate$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'carts' AND column_name = 'promo_code_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'carts' AND column_name = 'applied_promo_code_id'
      ) THEN
        ALTER TABLE "public"."carts" DROP CONSTRAINT IF EXISTS "carts_promo_code_id_promo_codes_id_fk";
        DROP INDEX IF EXISTS "public"."carts_promo_code_id_idx";
        ALTER TABLE "public"."carts" RENAME COLUMN "promo_code_id" TO "applied_promo_code_id";
        ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_applied_promo_code_id_promo_codes_id_fk"
          FOREIGN KEY ("applied_promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
        CREATE INDEX IF NOT EXISTS "carts_applied_promo_code_id_idx" ON "public"."carts" USING btree ("applied_promo_code_id");
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'promo_code_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'applied_promo_code_id'
      ) THEN
        ALTER TABLE "public"."orders" DROP CONSTRAINT IF EXISTS "orders_promo_code_id_promo_codes_id_fk";
        DROP INDEX IF EXISTS "public"."orders_promo_code_id_idx";
        ALTER TABLE "public"."orders" RENAME COLUMN "promo_code_id" TO "applied_promo_code_id";
        ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_applied_promo_code_id_promo_codes_id_fk"
          FOREIGN KEY ("applied_promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
        CREATE INDEX IF NOT EXISTS "orders_applied_promo_code_id_idx" ON "public"."orders" USING btree ("applied_promo_code_id");
      END IF;
    END
    $migrate$;
  `)
}
