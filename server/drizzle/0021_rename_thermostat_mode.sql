ALTER TABLE "ac_thermostats" RENAME COLUMN "mode" TO "climate_mode";--> statement-breakpoint
ALTER TABLE "ac_thermostats" RENAME CONSTRAINT "ac_thermostats_mode_check" TO "ac_thermostats_climate_mode_check";--> statement-breakpoint
ALTER TABLE "ac_thermostats" DROP CONSTRAINT "ac_thermostats_threshold_check";--> statement-breakpoint
ALTER TABLE "ac_thermostats" ADD CONSTRAINT "ac_thermostats_threshold_check" CHECK (
  ("ac_thermostats"."climate_mode" = 'cool' AND "ac_thermostats"."temp_on" > "ac_thermostats"."temp_off")
  OR ("ac_thermostats"."climate_mode" = 'heat' AND "ac_thermostats"."temp_off" > "ac_thermostats"."temp_on")
);
