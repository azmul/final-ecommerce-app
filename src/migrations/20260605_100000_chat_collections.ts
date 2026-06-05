import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_chat_conversations_status" AS ENUM('open', 'pending', 'resolved', 'closed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      CREATE TYPE "public"."enum_chat_messages_sender_type" AS ENUM('customer', 'agent', 'system');
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE TABLE IF NOT EXISTS "chat_conversations" (
      "id" serial PRIMARY KEY NOT NULL,
      "status" "enum_chat_conversations_status" DEFAULT 'open' NOT NULL,
      "customer_id" integer,
      "guest_session_id" varchar,
      "assigned_agent_id" integer,
      "subject" varchar,
      "context_page_url" varchar,
      "context_product_slug" varchar,
      "context_cart_id" integer,
      "context_order_id" integer,
      "context_guest_order_access_token" varchar,
      "last_message_at" timestamp(3) with time zone,
      "last_message_preview" varchar,
      "unread_by_customer" numeric DEFAULT 0,
      "unread_by_agent" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "chat_messages" (
      "id" serial PRIMARY KEY NOT NULL,
      "conversation_id" integer NOT NULL,
      "sender_type" "enum_chat_messages_sender_type" NOT NULL,
      "sender_id" integer,
      "body" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "chat_conversations_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "chat_messages_id" integer;

    DO $payload$ BEGIN
      ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_customer_id_users_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_assigned_agent_id_users_id_fk"
        FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_context_cart_id_carts_id_fk"
        FOREIGN KEY ("context_cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_context_order_id_orders_id_fk"
        FOREIGN KEY ("context_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk"
        FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk"
        FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chat_conversations_fk"
        FOREIGN KEY ("chat_conversations_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    DO $payload$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chat_messages_fk"
        FOREIGN KEY ("chat_messages_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;

    CREATE INDEX IF NOT EXISTS "chat_conversations_status_idx" ON "chat_conversations" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "chat_conversations_customer_idx" ON "chat_conversations" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "chat_conversations_guest_session_id_idx" ON "chat_conversations" USING btree ("guest_session_id");
    CREATE INDEX IF NOT EXISTS "chat_conversations_assigned_agent_idx" ON "chat_conversations" USING btree ("assigned_agent_id");
    CREATE INDEX IF NOT EXISTS "chat_conversations_last_message_at_idx" ON "chat_conversations" USING btree ("last_message_at");
    CREATE INDEX IF NOT EXISTS "chat_conversations_updated_at_idx" ON "chat_conversations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "chat_conversations_created_at_idx" ON "chat_conversations" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");
    CREATE INDEX IF NOT EXISTS "chat_messages_updated_at_idx" ON "chat_messages" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_chat_conversations_id_idx"
      ON "payload_locked_documents_rels" USING btree ("chat_conversations_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_chat_messages_id_idx"
      ON "payload_locked_documents_rels" USING btree ("chat_messages_id");

    DO $payload$ BEGIN
      ALTER TYPE "public"."enum_users_staff_grants_page" ADD VALUE IF NOT EXISTS 'chat';
    EXCEPTION WHEN duplicate_object THEN NULL; END $payload$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_chat_conversations_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_chat_messages_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_chat_conversations_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_chat_messages_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "chat_conversations_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "chat_messages_id";

    DROP TABLE IF EXISTS "chat_messages" CASCADE;
    DROP TABLE IF EXISTS "chat_conversations" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_chat_messages_sender_type";
    DROP TYPE IF EXISTS "public"."enum_chat_conversations_status";
  `)
}
