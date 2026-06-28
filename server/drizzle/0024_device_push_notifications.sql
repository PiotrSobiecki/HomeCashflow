ALTER TABLE "push_subscriptions" ADD COLUMN "washer_cycle_notify" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "plug_power_notify" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "cycle_notify_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "last_cycle_state" text;
--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "plug_notify_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "power_threshold_w" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "last_power_above" boolean;
--> statement-breakpoint
ALTER TABLE "smart_devices" ADD CONSTRAINT "smart_devices_last_cycle_state_check"
  CHECK ("last_cycle_state" IS NULL OR "last_cycle_state" IN ('running', 'paused', 'finished', 'idle', 'unknown'));
