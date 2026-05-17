import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Marketing / campaign layout blocks on `pages` (hero, countdown, features, trust stats, banner strip).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_campaign_hero" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "eyebrow" varchar,
     "headline" varchar NOT NULL,
     "description" varchar,
     "background_image_id" integer NOT NULL,
     "overlay" varchar,
     "alignment" varchar,
     "primary_label" varchar NOT NULL,
     "primary_url" varchar NOT NULL,
     "secondary_label" varchar,
     "secondary_url" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_campaign_hero" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "eyebrow" varchar,
     "headline" varchar,
     "description" varchar,
     "background_image_id" integer,
     "overlay" varchar,
     "alignment" varchar,
     "primary_label" varchar,
     "primary_url" varchar,
     "secondary_label" varchar,
     "secondary_url" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_countdown_promo" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "eyebrow" varchar,
     "headline" varchar NOT NULL,
     "description" varchar,
     "end_date" timestamptz NOT NULL,
     "promo_code" varchar,
     "cta_label" varchar NOT NULL,
     "cta_url" varchar NOT NULL,
     "theme" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_countdown_promo" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "eyebrow" varchar,
     "headline" varchar,
     "description" varchar,
     "end_date" timestamptz,
     "promo_code" varchar,
     "cta_label" varchar,
     "cta_url" varchar,
     "theme" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_marketing_features" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "heading" varchar,
     "subheading" varchar,
     "columns" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_marketing_features_items" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "icon" varchar NOT NULL,
     "title" varchar NOT NULL,
     "description" varchar NOT NULL,
     "link_url" varchar,
     "link_label" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_marketing_features" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "heading" varchar,
     "subheading" varchar,
     "columns" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_marketing_features_items" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "icon" varchar,
     "title" varchar,
     "description" varchar,
     "link_url" varchar,
     "link_label" varchar,
     "_uuid" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_trust_stats" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "variant" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_trust_stats_items" (
     "_order" integer NOT NULL,
     "_parent_id" varchar NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "value" varchar NOT NULL,
     "label" varchar NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_trust_stats" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "variant" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_trust_stats_items" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "value" varchar,
     "label" varchar,
     "_uuid" varchar
   );

   CREATE TABLE IF NOT EXISTS "pages_blocks_campaign_banner_strip" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "message" varchar NOT NULL,
     "highlight" varchar,
     "cta_label" varchar NOT NULL,
     "cta_url" varchar NOT NULL,
     "style" varchar,
     "block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "_pages_v_blocks_campaign_banner_strip" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "_path" text NOT NULL,
     "id" serial PRIMARY KEY NOT NULL,
     "message" varchar,
     "highlight" varchar,
     "cta_label" varchar,
     "cta_url" varchar,
     "style" varchar,
     "_uuid" varchar,
     "block_name" varchar
   );

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_campaign_hero" ADD CONSTRAINT "pages_blocks_campaign_hero_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_campaign_hero" ADD CONSTRAINT "pages_blocks_campaign_hero_background_image_id_media_id_fk"
       FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_campaign_hero" ADD CONSTRAINT "_pages_v_blocks_campaign_hero_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_campaign_hero" ADD CONSTRAINT "_pages_v_blocks_campaign_hero_background_image_id_media_id_fk"
       FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_countdown_promo" ADD CONSTRAINT "pages_blocks_countdown_promo_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_countdown_promo" ADD CONSTRAINT "_pages_v_blocks_countdown_promo_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_marketing_features" ADD CONSTRAINT "pages_blocks_marketing_features_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_marketing_features_items" ADD CONSTRAINT "pages_blocks_marketing_features_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_marketing_features"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_marketing_features" ADD CONSTRAINT "_pages_v_blocks_marketing_features_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_marketing_features_items" ADD CONSTRAINT "_pages_v_blocks_marketing_features_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_marketing_features"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_trust_stats" ADD CONSTRAINT "pages_blocks_trust_stats_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_trust_stats_items" ADD CONSTRAINT "pages_blocks_trust_stats_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_trust_stats"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_trust_stats" ADD CONSTRAINT "_pages_v_blocks_trust_stats_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_trust_stats_items" ADD CONSTRAINT "_pages_v_blocks_trust_stats_items_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_trust_stats"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   DO $payload$ BEGIN
     ALTER TABLE "pages_blocks_campaign_banner_strip" ADD CONSTRAINT "pages_blocks_campaign_banner_strip_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
   DO $payload$ BEGIN
     ALTER TABLE "_pages_v_blocks_campaign_banner_strip" ADD CONSTRAINT "_pages_v_blocks_campaign_banner_strip_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

   CREATE INDEX IF NOT EXISTS "pages_blocks_campaign_hero_order_idx" ON "pages_blocks_campaign_hero" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_campaign_hero_parent_id_idx" ON "pages_blocks_campaign_hero" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_campaign_hero_path_idx" ON "pages_blocks_campaign_hero" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "pages_blocks_campaign_hero_bg_image_idx" ON "pages_blocks_campaign_hero" USING btree ("background_image_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_campaign_hero_order_idx" ON "_pages_v_blocks_campaign_hero" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_campaign_hero_parent_id_idx" ON "_pages_v_blocks_campaign_hero" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_campaign_hero_path_idx" ON "_pages_v_blocks_campaign_hero" USING btree ("_path");

   CREATE INDEX IF NOT EXISTS "pages_blocks_countdown_promo_order_idx" ON "pages_blocks_countdown_promo" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_countdown_promo_parent_id_idx" ON "pages_blocks_countdown_promo" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_countdown_promo_path_idx" ON "pages_blocks_countdown_promo" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_countdown_promo_order_idx" ON "_pages_v_blocks_countdown_promo" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_countdown_promo_parent_id_idx" ON "_pages_v_blocks_countdown_promo" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_countdown_promo_path_idx" ON "_pages_v_blocks_countdown_promo" USING btree ("_path");

   CREATE INDEX IF NOT EXISTS "pages_blocks_marketing_features_order_idx" ON "pages_blocks_marketing_features" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_marketing_features_parent_id_idx" ON "pages_blocks_marketing_features" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_marketing_features_path_idx" ON "pages_blocks_marketing_features" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "pages_blocks_marketing_features_items_order_idx" ON "pages_blocks_marketing_features_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_marketing_features_items_parent_id_idx" ON "pages_blocks_marketing_features_items" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_marketing_features_order_idx" ON "_pages_v_blocks_marketing_features" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_marketing_features_parent_id_idx" ON "_pages_v_blocks_marketing_features" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_marketing_features_path_idx" ON "_pages_v_blocks_marketing_features" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_marketing_features_items_order_idx" ON "_pages_v_blocks_marketing_features_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_marketing_features_items_parent_id_idx" ON "_pages_v_blocks_marketing_features_items" USING btree ("_parent_id");

   CREATE INDEX IF NOT EXISTS "pages_blocks_trust_stats_order_idx" ON "pages_blocks_trust_stats" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_trust_stats_parent_id_idx" ON "pages_blocks_trust_stats" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_trust_stats_path_idx" ON "pages_blocks_trust_stats" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "pages_blocks_trust_stats_items_order_idx" ON "pages_blocks_trust_stats_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_trust_stats_items_parent_id_idx" ON "pages_blocks_trust_stats_items" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_trust_stats_order_idx" ON "_pages_v_blocks_trust_stats" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_trust_stats_parent_id_idx" ON "_pages_v_blocks_trust_stats" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_trust_stats_path_idx" ON "_pages_v_blocks_trust_stats" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_trust_stats_items_order_idx" ON "_pages_v_blocks_trust_stats_items" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_trust_stats_items_parent_id_idx" ON "_pages_v_blocks_trust_stats_items" USING btree ("_parent_id");

   CREATE INDEX IF NOT EXISTS "pages_blocks_campaign_banner_strip_order_idx" ON "pages_blocks_campaign_banner_strip" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "pages_blocks_campaign_banner_strip_parent_id_idx" ON "pages_blocks_campaign_banner_strip" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "pages_blocks_campaign_banner_strip_path_idx" ON "pages_blocks_campaign_banner_strip" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_campaign_banner_strip_order_idx" ON "_pages_v_blocks_campaign_banner_strip" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_campaign_banner_strip_parent_id_idx" ON "_pages_v_blocks_campaign_banner_strip" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_pages_v_blocks_campaign_banner_strip_path_idx" ON "_pages_v_blocks_campaign_banner_strip" USING btree ("_path");
 `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_pages_v_blocks_campaign_banner_strip" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_campaign_banner_strip" CASCADE;

   DROP TABLE IF EXISTS "_pages_v_blocks_trust_stats_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_trust_stats" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_trust_stats_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_trust_stats" CASCADE;

   DROP TABLE IF EXISTS "_pages_v_blocks_marketing_features_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_marketing_features" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_marketing_features_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_marketing_features" CASCADE;

   DROP TABLE IF EXISTS "_pages_v_blocks_countdown_promo" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_countdown_promo" CASCADE;

   DROP TABLE IF EXISTS "_pages_v_blocks_campaign_hero" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_campaign_hero" CASCADE;
 `)
}
