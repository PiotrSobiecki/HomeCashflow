CREATE TABLE "tuya_credentials" (
	"household_id" uuid PRIMARY KEY NOT NULL,
	"client_id_enc" text NOT NULL,
	"client_secret_enc" text NOT NULL,
	"device_id" text,
	"datacenter" text DEFAULT 'eu' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tuya_credentials_datacenter_check" CHECK ("tuya_credentials"."datacenter" IN ('eu', 'us', 'cn', 'in'))
);
--> statement-breakpoint
ALTER TABLE "tuya_credentials" ADD CONSTRAINT "tuya_credentials_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuya_credentials" ADD CONSTRAINT "tuya_credentials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;