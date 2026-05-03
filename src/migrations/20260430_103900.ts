import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "wishlists" (
      "id" serial PRIMARY KEY NOT NULL,
      "customer_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "wishlists_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );

    DO $payload$ BEGIN
      ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
    DO $payload$ BEGIN
      ALTER TABLE "wishlists_rels" ADD CONSTRAINT "wishlists_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
    DO $payload$ BEGIN
      ALTER TABLE "wishlists_rels" ADD CONSTRAINT "wishlists_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE UNIQUE INDEX IF NOT EXISTS "wishlists_customer_idx" ON "wishlists" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "wishlists_updated_at_idx" ON "wishlists" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "wishlists_created_at_idx" ON "wishlists" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "wishlists_rels_order_idx" ON "wishlists_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "wishlists_rels_parent_idx" ON "wishlists_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "wishlists_rels_path_idx" ON "wishlists_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "wishlists_rels_products_id_idx" ON "wishlists_rels" USING btree ("products_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "wishlists_rels" CASCADE;
    DROP TABLE IF EXISTS "wishlists" CASCADE;
  `)
}
