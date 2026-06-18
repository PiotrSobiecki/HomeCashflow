ALTER TABLE "smart_devices" ALTER COLUMN "tuya_device_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "provider" text DEFAULT 'tuya' NOT NULL;--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "external_device_id" text;--> statement-breakpoint
UPDATE "smart_devices" SET "external_device_id" = "tuya_device_id" WHERE "provider" = 'tuya' AND "external_device_id" IS NULL;--> statement-breakpoint
ALTER TABLE "smart_devices" ADD COLUMN "capabilities_json" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_smart_devices_provider_external" ON "smart_devices" USING btree ("provider","external_device_id");--> statement-breakpoint
ALTER TABLE "smart_devices" ADD CONSTRAINT "smart_devices_provider_check" CHECK ("smart_devices"."provider" IN ('tuya', 'smartthings'));