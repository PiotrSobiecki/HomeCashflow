-- BASELINE: ten plik jest bezpieczny do uruchomienia na bazie, która już ma te tabele (no-op).
-- Generowany przez `drizzle-kit generate`, następnie ręcznie utwardzony do IF NOT EXISTS / DO bloków.
-- Kolejne migracje będą generowane normalnie i niech już zostają w surowej formie.

CREATE TABLE IF NOT EXISTS "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid,
	"user_name" text,
	"at" timestamp with time zone NOT NULL,
	"action" text NOT NULL,
	"kind" text,
	"label" text,
	"amount" numeric(14, 2),
	"month" integer,
	"legacy_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"monthly_limit" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"legacy_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deleted_fixed_items" (
	"household_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "deleted_fixed_items_household_id_year_month_kind_name_pk" PRIMARY KEY("household_id","year","month","kind","name"),
	CONSTRAINT "deleted_fixed_kind_check" CHECK ("deleted_fixed_items"."kind" IN ('income', 'expense')),
	CONSTRAINT "deleted_fixed_month_check" CHECK ("deleted_fixed_items"."month" BETWEEN 0 AND 11)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"data" text DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "finance_data_household_id_unique" UNIQUE("household_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_data_migration" (
	"household_id" uuid PRIMARY KEY NOT NULL,
	"migrated_at" timestamp with time zone DEFAULT now(),
	"source_updated_at" timestamp with time zone,
	"txn_count" integer,
	"savings_count" integer,
	"category_count" integer,
	"activity_count" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "household_members" (
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "household_members_household_id_user_id_pk" PRIMARY KEY("household_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'Moje gospodarstwo' NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"email" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "invitations_status_check" CHECK ("invitations"."status" IN ('pending', 'accepted', 'declined'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "savings_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"legacy_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "savings_goals" (
	"household_id" uuid PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'none' NOT NULL,
	"monthly_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"yearly_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"target_month" integer DEFAULT 11 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "savings_goals_type_check" CHECK ("savings_goals"."type" IN ('none', 'monthly', 'yearly')),
	CONSTRAINT "savings_goals_target_month_check" CHECK ("savings_goals"."target_month" BETWEEN 0 AND 11)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"txn_date" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"is_fixed" boolean DEFAULT false NOT NULL,
	"category" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"legacy_id" text,
	CONSTRAINT "transactions_kind_check" CHECK ("transactions"."kind" IN ('income', 'expense')),
	CONSTRAINT "transactions_month_check" CHECK ("transactions"."month" BETWEEN 0 AND 11)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "category_budgets" ADD CONSTRAINT "category_budgets_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "deleted_fixed_items" ADD CONSTRAINT "deleted_fixed_items_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "finance_data" ADD CONSTRAINT "finance_data_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "finance_data_migration" ADD CONSTRAINT "finance_data_migration_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "households" ADD CONSTRAINT "households_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "invitations" ADD CONSTRAINT "invitations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_household_at" ON "activity_log" USING btree ("household_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "category_budgets_household_name_key" ON "category_budgets" USING btree ("household_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_household_month" ON "transactions" USING btree ("household_id","year","month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_household_kind" ON "transactions" USING btree ("household_id","kind");
