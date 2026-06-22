ALTER TABLE "ac_thermostats" ADD COLUMN "last_check_action" text;--> statement-breakpoint
ALTER TABLE "ac_thermostats" ADD CONSTRAINT "ac_thermostats_last_check_action_check" CHECK ("ac_thermostats"."last_check_action" IS NULL OR "ac_thermostats"."last_check_action" IN ('on', 'off'));
