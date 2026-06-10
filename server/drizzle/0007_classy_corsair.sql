CREATE TABLE "smart_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"tuya_device_id" text NOT NULL,
	"display_name" text NOT NULL,
	"product_name" text,
	"product_id" text,
	"device_type" text DEFAULT 'plug',
	"functions_json" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "smart_devices_tuya_device_id_unique" UNIQUE("tuya_device_id")
);
--> statement-breakpoint
ALTER TABLE "smart_devices" ADD CONSTRAINT "smart_devices_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_devices" ADD CONSTRAINT "smart_devices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_smart_devices_household" ON "smart_devices" USING btree ("household_id");