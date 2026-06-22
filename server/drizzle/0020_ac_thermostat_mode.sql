ALTER TABLE "ac_thermostats" ADD COLUMN "mode" text DEFAULT 'cool' NOT NULL;--> statement-breakpoint
ALTER TABLE "ac_thermostats" DROP CONSTRAINT "ac_thermostats_threshold_check";--> statement-breakpoint
ALTER TABLE "ac_thermostats" ADD CONSTRAINT "ac_thermostats_mode_check" CHECK ("ac_thermostats"."mode" IN ('cool', 'heat'));--> statement-breakpoint
ALTER TABLE "ac_thermostats" ADD CONSTRAINT "ac_thermostats_threshold_check" CHECK (
  ("ac_thermostats"."mode" = 'cool' AND "ac_thermostats"."temp_on" > "ac_thermostats"."temp_off")
  OR ("ac_thermostats"."mode" = 'heat' AND "ac_thermostats"."temp_off" > "ac_thermostats"."temp_on")
);
