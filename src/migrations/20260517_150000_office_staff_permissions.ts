import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * officeStaff role + per-user permission grants (users_staff_grants).
 *
 * Logical schema:
 * - users_roles (existing): user ↔ role including officeStaff
 * - users_staff_grants: page + actions per grant row
 * - users.staff_permissions (json): denormalized map for JWT
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TYPE "public"."enum_users_roles" ADD VALUE IF NOT EXISTS 'officeStaff';
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_users_staff_grants_page" AS ENUM(
        'pages', 'posts', 'blog-comments', 'categories', 'subcategories', 'brands', 'media',
        'forms', 'form-submissions', 'products', 'orders', 'carts', 'transactions',
        'promo-codes', 'product-reviews', 'shipments', 'wishlists',
        'notification-preferences', 'notification-broadcasts', 'user-notifications',
        'push-subscriptions', 'product-alerts', 'sales-dashboard', 'header', 'footer'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_users_staff_grants_actions" AS ENUM(
        'view', 'create', 'edit', 'delete', 'approve'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users_staff_grants" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "page" "enum_users_staff_grants_page" NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users_staff_grants_actions" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" "enum_users_staff_grants_actions",
      "id" serial PRIMARY KEY NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "staff_permissions" jsonb;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "users_staff_grants" ADD CONSTRAINT "users_staff_grants_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    DO $payload$ BEGIN
      ALTER TABLE "users_staff_grants_actions" ADD CONSTRAINT "users_staff_grants_actions_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."users_staff_grants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "users_staff_grants_order_idx" ON "users_staff_grants" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "users_staff_grants_parent_id_idx" ON "users_staff_grants" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "users_staff_grants_actions_order_idx" ON "users_staff_grants_actions" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "users_staff_grants_actions_parent_idx" ON "users_staff_grants_actions" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "users_staff_grants_actions" CASCADE;
    DROP TABLE IF EXISTS "users_staff_grants" CASCADE;
    ALTER TABLE "users" DROP COLUMN IF EXISTS "staff_permissions";
    DROP TYPE IF EXISTS "public"."enum_users_staff_grants_actions";
    DROP TYPE IF EXISTS "public"."enum_users_staff_grants_page";
  `)
}
