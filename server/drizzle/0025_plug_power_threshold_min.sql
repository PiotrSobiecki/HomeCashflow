ALTER TABLE "smart_devices" ADD COLUMN "power_threshold_min_w" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "last_power_below" boolean;
