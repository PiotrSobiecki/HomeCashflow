ALTER TABLE "transactions" ADD COLUMN "deleted_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "transactions" SET "deleted_at" = NOW(), "updated_at" = NOW() WHERE "exclude_from_analysis" = true;
