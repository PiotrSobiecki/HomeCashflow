CREATE TABLE "smartthings_credentials" (
	"household_id" uuid PRIMARY KEY NOT NULL,
	"access_token_enc" text NOT NULL,
	"refresh_token_enc" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scopes" text,
	"location_id" text,
	"samsung_account_id" text,
	"verified_at" timestamp with time zone,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "smartthings_credentials" ADD CONSTRAINT "smartthings_credentials_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smartthings_credentials" ADD CONSTRAINT "smartthings_credentials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;