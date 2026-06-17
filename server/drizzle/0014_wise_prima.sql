CREATE TABLE "device_timers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"fire_at" timestamp with time zone NOT NULL,
	"action" text DEFAULT 'off' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "device_timers_status_check" CHECK ("device_timers"."status" IN ('pending', 'done', 'canceled', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "device_timers" ADD CONSTRAINT "device_timers_device_id_smart_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."smart_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_timers" ADD CONSTRAINT "device_timers_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_timers" ADD CONSTRAINT "device_timers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_device_timers_status_fire" ON "device_timers" USING btree ("status","fire_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_device_timer_pending" ON "device_timers" USING btree ("device_id") WHERE "device_timers"."status" = 'pending';