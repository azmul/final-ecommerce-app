import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the AEO/GEO collection-field additions from the AI-citation audit:
 *
 *   Products.identifiers  — gtin, gtin13, mpn (scalar columns on `products`)
 *   Brands.aboutBrand     — foundedDate, headquarters, officialWebsite, sameAs (array),
 *                            areaServed, warrantyPolicy (richText jsonb)
 *   Users.authorProfile   — bio (richText), jobTitle, expertise (array of {topic}),
 *                            credentials, photo (media rel), sameAs (array of {url}),
 *                            authorSlug
 *
 * Array fields become child tables with the canonical Payload/Drizzle layout
 * (_order, _parent_id, id varchar PK, payload columns) plus FK + indexes.
 *
 * All ALTER and CREATE statements are guarded with IF NOT EXISTS / EXCEPTION
 * blocks so the migration is idempotent across partial runs and concurrent
 * `next build` workers, the same pattern used by the surrounding migrations.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(42962301)`)

  // === Products: identifiers group (scalar columns) ===
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "identifiers_gtin" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "identifiers_gtin13" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "identifiers_mpn" varchar;
  `)
  // Versioned (drafts) shadow table for products, if it exists in this schema.
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_products_v') THEN
        ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_identifiers_gtin" varchar;
        ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_identifiers_gtin13" varchar;
        ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_identifiers_mpn" varchar;
      END IF;
    END $$;
  `)

  // === Brands: aboutBrand group (scalar columns) ===
  await db.execute(sql`
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "about_brand_founded_date" timestamp(3) with time zone;
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "about_brand_headquarters" varchar;
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "about_brand_official_website" varchar;
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "about_brand_area_served" varchar;
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "about_brand_warranty_policy" jsonb;
  `)

  // === Brands.aboutBrand.sameAs (array field) ===
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "brands_about_brand_same_as" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "url" varchar NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "brands_about_brand_same_as" ADD CONSTRAINT "brands_about_brand_same_as_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."brands"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "brands_about_brand_same_as_order_idx"
      ON "brands_about_brand_same_as" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "brands_about_brand_same_as_parent_id_idx"
      ON "brands_about_brand_same_as" USING btree ("_parent_id");
  `)

  // === Users: authorProfile group (scalar columns) ===
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "author_profile_bio" jsonb;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "author_profile_job_title" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "author_profile_credentials" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "author_profile_photo_id" integer;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "author_profile_author_slug" varchar;

    DO $$ BEGIN
      ALTER TABLE "users" ADD CONSTRAINT "users_author_profile_photo_id_media_id_fk"
        FOREIGN KEY ("author_profile_photo_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "users_author_profile_photo_idx"
      ON "users" USING btree ("author_profile_photo_id");
    CREATE INDEX IF NOT EXISTS "users_author_profile_author_slug_idx"
      ON "users" USING btree ("author_profile_author_slug");
  `)

  // === Users.authorProfile.expertise (array of {topic}) ===
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users_author_profile_expertise" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "topic" varchar NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "users_author_profile_expertise" ADD CONSTRAINT "users_author_profile_expertise_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "users_author_profile_expertise_order_idx"
      ON "users_author_profile_expertise" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "users_author_profile_expertise_parent_id_idx"
      ON "users_author_profile_expertise" USING btree ("_parent_id");
  `)

  // === Users.authorProfile.sameAs (array of {url}) ===
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users_author_profile_same_as" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "url" varchar NOT NULL
    );
    DO $$ BEGIN
      ALTER TABLE "users_author_profile_same_as" ADD CONSTRAINT "users_author_profile_same_as_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE INDEX IF NOT EXISTS "users_author_profile_same_as_order_idx"
      ON "users_author_profile_same_as" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "users_author_profile_same_as_parent_id_idx"
      ON "users_author_profile_same_as" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(42962301)`)

  await db.execute(sql`DROP TABLE IF EXISTS "users_author_profile_same_as";`)
  await db.execute(sql`DROP TABLE IF EXISTS "users_author_profile_expertise";`)
  await db.execute(sql`DROP TABLE IF EXISTS "brands_about_brand_same_as";`)

  await db.execute(sql`
    ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_author_profile_photo_id_media_id_fk";
    DROP INDEX IF EXISTS "users_author_profile_photo_idx";
    DROP INDEX IF EXISTS "users_author_profile_author_slug_idx";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "author_profile_bio";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "author_profile_job_title";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "author_profile_credentials";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "author_profile_photo_id";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "author_profile_author_slug";

    ALTER TABLE "brands" DROP COLUMN IF EXISTS "about_brand_founded_date";
    ALTER TABLE "brands" DROP COLUMN IF EXISTS "about_brand_headquarters";
    ALTER TABLE "brands" DROP COLUMN IF EXISTS "about_brand_official_website";
    ALTER TABLE "brands" DROP COLUMN IF EXISTS "about_brand_area_served";
    ALTER TABLE "brands" DROP COLUMN IF EXISTS "about_brand_warranty_policy";

    ALTER TABLE "products" DROP COLUMN IF EXISTS "identifiers_gtin";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "identifiers_gtin13";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "identifiers_mpn";
  `)

  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_products_v') THEN
        ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_identifiers_gtin";
        ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_identifiers_gtin13";
        ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_identifiers_mpn";
      END IF;
    END $$;
  `)
}
