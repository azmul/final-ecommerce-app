import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** Idempotent renames: pg_catalog checks (more reliable than information_schema with quoted rels). */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'products' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'price_in_u_s_d_enabled'
      ) THEN
        ALTER TABLE "products" RENAME COLUMN "price_in_u_s_d_enabled" TO "price_in_b_d_t_enabled";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'products' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'price_in_u_s_d'
      ) THEN
        ALTER TABLE "products" RENAME COLUMN "price_in_u_s_d" TO "price_in_b_d_t";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = '_products_v' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'version_price_in_u_s_d_enabled'
      ) THEN
        ALTER TABLE "_products_v" RENAME COLUMN "version_price_in_u_s_d_enabled" TO "version_price_in_b_d_t_enabled";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = '_products_v' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'version_price_in_u_s_d'
      ) THEN
        ALTER TABLE "_products_v" RENAME COLUMN "version_price_in_u_s_d" TO "version_price_in_b_d_t";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'variants' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'price_in_u_s_d_enabled'
      ) THEN
        ALTER TABLE "variants" RENAME COLUMN "price_in_u_s_d_enabled" TO "price_in_b_d_t_enabled";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'variants' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'price_in_u_s_d'
      ) THEN
        ALTER TABLE "variants" RENAME COLUMN "price_in_u_s_d" TO "price_in_b_d_t";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = '_variants_v' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'version_price_in_u_s_d_enabled'
      ) THEN
        ALTER TABLE "_variants_v" RENAME COLUMN "version_price_in_u_s_d_enabled" TO "version_price_in_b_d_t_enabled";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = '_variants_v' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'version_price_in_u_s_d'
      ) THEN
        ALTER TABLE "_variants_v" RENAME COLUMN "version_price_in_u_s_d" TO "version_price_in_b_d_t";
      END IF;
    END $payload$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'products' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'price_in_b_d_t_enabled'
      ) THEN
        ALTER TABLE "products" RENAME COLUMN "price_in_b_d_t_enabled" TO "price_in_u_s_d_enabled";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'products' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'price_in_b_d_t'
      ) THEN
        ALTER TABLE "products" RENAME COLUMN "price_in_b_d_t" TO "price_in_u_s_d";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = '_products_v' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'version_price_in_b_d_t_enabled'
      ) THEN
        ALTER TABLE "_products_v" RENAME COLUMN "version_price_in_b_d_t_enabled" TO "version_price_in_u_s_d_enabled";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = '_products_v' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'version_price_in_b_d_t'
      ) THEN
        ALTER TABLE "_products_v" RENAME COLUMN "version_price_in_b_d_t" TO "version_price_in_u_s_d";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'variants' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'price_in_b_d_t_enabled'
      ) THEN
        ALTER TABLE "variants" RENAME COLUMN "price_in_b_d_t_enabled" TO "price_in_u_s_d_enabled";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'variants' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'price_in_b_d_t'
      ) THEN
        ALTER TABLE "variants" RENAME COLUMN "price_in_b_d_t" TO "price_in_u_s_d";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = '_variants_v' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'version_price_in_b_d_t_enabled'
      ) THEN
        ALTER TABLE "_variants_v" RENAME COLUMN "version_price_in_b_d_t_enabled" TO "version_price_in_u_s_d_enabled";
      END IF;
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        INNER JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = '_variants_v' AND a.attnum > 0 AND NOT a.attisdropped
          AND a.attname = 'version_price_in_b_d_t'
      ) THEN
        ALTER TABLE "_variants_v" RENAME COLUMN "version_price_in_b_d_t" TO "version_price_in_u_s_d";
      END IF;
    END $payload$;
  `)
}
