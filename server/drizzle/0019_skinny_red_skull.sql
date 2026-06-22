CREATE TABLE "ac_thermostats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"location_label" text,
	"lat" numeric(8, 5),
	"lon" numeric(8, 5),
	"temp_on" numeric(4, 1) NOT NULL,
	"temp_off" numeric(4, 1) NOT NULL,
	"last_action" text,
	"last_outdoor_temp" numeric(4, 1),
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ac_thermostats_device_id_unique" UNIQUE("device_id"),
	CONSTRAINT "ac_thermostats_threshold_check" CHECK ("ac_thermostats"."temp_on" > "ac_thermostats"."temp_off"),
	CONSTRAINT "ac_thermostats_last_action_check" CHECK ("ac_thermostats"."last_action" IS NULL OR "ac_thermostats"."last_action" IN ('on', 'off'))
);
--> statement-breakpoint
ALTER TABLE "ac_thermostats" ADD CONSTRAINT "ac_thermostats_device_id_smart_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."smart_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ac_thermostats" ADD CONSTRAINT "ac_thermostats_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ac_thermostats_enabled" ON "ac_thermostats" USING btree ("enabled");