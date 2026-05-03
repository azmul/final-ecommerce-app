import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $enum_posts$ BEGIN
    CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $enum_posts$;
  DO $enum_posts_v$ BEGIN
    CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $enum_posts_v$;
  CREATE TABLE IF NOT EXISTS "pages_blocks_featured_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Featured Categories',
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_top_selling_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Top Selling Products',
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_featured_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Featured Categories',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_top_selling_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Top Selling Products',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"published_on" timestamp(3) with time zone,
  	"author_id" integer,
  	"excerpt" varchar,
  	"featured_image_id" integer,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_published_on" timestamp(3) with time zone,
  	"version_author_id" integer,
  	"version_excerpt" varchar,
  	"version_featured_image_id" integer,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_id" integer;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "discount_percentage" numeric;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_badge" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_discount_percentage" numeric;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_product_badge" varchar;
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_full_name" varchar;
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_phone" varchar;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "customer_full_name" varchar;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "customer_phone" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "posts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "wishlists_id" integer;
  DO $$ BEGIN
    ALTER TABLE "pages_blocks_featured_categories" ADD CONSTRAINT "pages_blocks_featured_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "pages_blocks_top_selling_products" ADD CONSTRAINT "pages_blocks_top_selling_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_pages_v_blocks_featured_categories" ADD CONSTRAINT "_pages_v_blocks_featured_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_pages_v_blocks_top_selling_products" ADD CONSTRAINT "_pages_v_blocks_top_selling_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "posts" ADD CONSTRAINT "posts_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "posts" ADD CONSTRAINT "posts_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "pages_blocks_featured_categories_order_idx" ON "pages_blocks_featured_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_featured_categories_parent_id_idx" ON "pages_blocks_featured_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_featured_categories_path_idx" ON "pages_blocks_featured_categories" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_top_selling_products_order_idx" ON "pages_blocks_top_selling_products" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_top_selling_products_parent_id_idx" ON "pages_blocks_top_selling_products" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_top_selling_products_path_idx" ON "pages_blocks_top_selling_products" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_featured_categories_order_idx" ON "_pages_v_blocks_featured_categories" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_featured_categories_parent_id_idx" ON "_pages_v_blocks_featured_categories" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_featured_categories_path_idx" ON "_pages_v_blocks_featured_categories" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_top_selling_products_order_idx" ON "_pages_v_blocks_top_selling_products" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_top_selling_products_parent_id_idx" ON "_pages_v_blocks_top_selling_products" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_top_selling_products_path_idx" ON "_pages_v_blocks_top_selling_products" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "posts_featured_image_idx" ON "posts" USING btree ("featured_image_id");
  CREATE INDEX IF NOT EXISTS "posts_meta_meta_image_idx" ON "posts" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_featured_image_idx" ON "_posts_v" USING btree ("version_featured_image_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");
  DO $$ BEGIN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wishlists_fk" FOREIGN KEY ("wishlists_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_wishlists_id_idx" ON "payload_locked_documents_rels" USING btree ("wishlists_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_featured_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_top_selling_products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_top_selling_products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_featured_categories" CASCADE;
  DROP TABLE "pages_blocks_top_selling_products" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_categories" CASCADE;
  DROP TABLE "_pages_v_blocks_top_selling_products" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  ALTER TABLE "categories" DROP CONSTRAINT "categories_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_posts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_wishlists_fk";
  
  DROP INDEX "categories_image_idx";
  DROP INDEX "payload_locked_documents_rels_posts_id_idx";
  DROP INDEX "payload_locked_documents_rels_wishlists_id_idx";
  ALTER TABLE "categories" DROP COLUMN "image_id";
  ALTER TABLE "products" DROP COLUMN "discount_percentage";
  ALTER TABLE "products" DROP COLUMN "product_badge";
  ALTER TABLE "_products_v" DROP COLUMN "version_discount_percentage";
  ALTER TABLE "_products_v" DROP COLUMN "version_product_badge";
  ALTER TABLE "orders" DROP COLUMN "customer_full_name";
  ALTER TABLE "orders" DROP COLUMN "customer_phone";
  ALTER TABLE "transactions" DROP COLUMN "customer_full_name";
  ALTER TABLE "transactions" DROP COLUMN "customer_phone";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "posts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "wishlists_id";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";`)
}
