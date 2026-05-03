import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "blog_comments" (
      "id" serial PRIMARY KEY NOT NULL,
      "post_id" integer NOT NULL,
      "author_id" integer,
      "body" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "blog_comments_id" integer;

    DO $payload$ BEGIN
      ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
    DO $payload$ BEGIN
      ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_comments_fk" FOREIGN KEY ("blog_comments_id") REFERENCES "public"."blog_comments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE INDEX IF NOT EXISTS "blog_comments_post_idx" ON "blog_comments" USING btree ("post_id");
    CREATE INDEX IF NOT EXISTS "blog_comments_author_idx" ON "blog_comments" USING btree ("author_id");
    CREATE INDEX IF NOT EXISTS "blog_comments_updated_at_idx" ON "blog_comments" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "blog_comments_created_at_idx" ON "blog_comments" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_blog_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_comments_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_blog_comments_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_blog_comments_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "blog_comments_id";

    DROP TABLE IF EXISTS "blog_comments" CASCADE;
  `)
}
