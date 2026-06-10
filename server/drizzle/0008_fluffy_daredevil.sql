CREATE TABLE "device_command_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"device_id" uuid,
	"actor_id" uuid,
	"code" text NOT NULL,
	"value" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device_command_log" ADD CONSTRAINT "device_command_log_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_command_log" ADD CONSTRAINT "device_command_log_device_id_smart_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."smart_devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_command_log" ADD CONSTRAINT "device_command_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_device_cmd_household_at" ON "device_command_log" USING btree ("household_id","at");