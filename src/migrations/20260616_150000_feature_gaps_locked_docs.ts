import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** Register new collections with Payload locked-documents rels + missing FK/indexes. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX IF NOT EXISTS "compare_lists_updated_at_idx" ON "compare_lists" USING btree ("updated_at");
   CREATE INDEX IF NOT EXISTS "compare_lists_created_at_idx" ON "compare_lists" USING btree ("created_at");
   CREATE INDEX IF NOT EXISTS "compare_lists_rels_order_idx" ON "compare_lists_rels" USING btree ("order");
   CREATE INDEX IF NOT EXISTS "compare_lists_rels_parent_idx" ON "compare_lists_rels" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "compare_lists_rels_path_idx" ON "compare_lists_rels" USING btree ("path");
   CREATE INDEX IF NOT EXISTS "compare_lists_rels_products_id_idx" ON "compare_lists_rels" USING btree ("products_id");

   DO $payload$ BEGIN
     ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_cart_id_carts_id_fk"
       FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_product_id_products_id_fk"
       FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_variant_id_variants_id_fk"
       FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "inventory_reservations_variant_idx" ON "inventory_reservations" USING btree ("variant_id");
   CREATE INDEX IF NOT EXISTS "inventory_reservations_updated_at_idx" ON "inventory_reservations" USING btree ("updated_at");
   CREATE INDEX IF NOT EXISTS "inventory_reservations_created_at_idx" ON "inventory_reservations" USING btree ("created_at");

   DO $payload$ BEGIN
     ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_users_id_fk"
       FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "admin_audit_logs_actor_idx" ON "admin_audit_logs" USING btree ("actor_id");
   CREATE INDEX IF NOT EXISTS "admin_audit_logs_updated_at_idx" ON "admin_audit_logs" USING btree ("updated_at");
   CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_at_idx" ON "admin_audit_logs" USING btree ("created_at");
  `)

  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "compare_lists_id" integer;
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "inventory_reservations_id" integer;
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "admin_audit_logs_id" integer;
  `)

  await db.execute(sql`
   DO $payload$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_compare_lists_fk"
       FOREIGN KEY ("compare_lists_id") REFERENCES "public"."compare_lists"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inventory_reservations_fk"
       FOREIGN KEY ("inventory_reservations_id") REFERENCES "public"."inventory_reservations"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admin_audit_logs_fk"
       FOREIGN KEY ("admin_audit_logs_id") REFERENCES "public"."admin_audit_logs"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)

  await db.execute(sql`
   CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_compare_lists_id_idx" ON "payload_locked_documents_rels" USING btree ("compare_lists_id");
   CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_inventory_reservations_id_idx" ON "payload_locked_documents_rels" USING btree ("inventory_reservations_id");
   CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_admin_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("admin_audit_logs_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "payload_locked_documents_rels_admin_audit_logs_id_idx";
   DROP INDEX IF EXISTS "payload_locked_documents_rels_inventory_reservations_id_idx";
   DROP INDEX IF EXISTS "payload_locked_documents_rels_compare_lists_id_idx";

   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_admin_audit_logs_fk";
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inventory_reservations_fk";
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_compare_lists_fk";

   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "admin_audit_logs_id";
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "inventory_reservations_id";
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "compare_lists_id";
  `)
}
