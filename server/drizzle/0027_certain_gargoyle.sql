CREATE TABLE "bank_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"aspsp_name" text NOT NULL,
	"aspsp_country" text DEFAULT 'PL' NOT NULL,
	"session_id_enc" text NOT NULL,
	"accounts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"valid_until" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bank_connections_status_check" CHECK ("bank_connections"."status" IN ('active', 'expired', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "bank_txn_ref" text;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bank_connections_household" ON "bank_connections" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_bank_connections_user_aspsp" ON "bank_connections" USING btree ("household_id","user_id","aspsp_name");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_transactions_bank_ref" ON "transactions" USING btree ("household_id","bank_txn_ref") WHERE "transactions"."bank_txn_ref" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_source_check" CHECK ("transactions"."source" IN ('manual', 'bank'));
