CREATE TABLE "device_energy_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"power_w" numeric(10, 2),
	"energy_kwh" numeric(12, 4),
	"switch_on" boolean,
	"is_online" boolean
);
--> statement-breakpoint
ALTER TABLE "device_energy_snapshots" ADD CONSTRAINT "device_energy_snapshots_device_id_smart_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."smart_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_energy_device_at" ON "device_energy_snapshots" USING btree ("device_id","recorded_at");