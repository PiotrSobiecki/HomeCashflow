CREATE TABLE "action_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"actor_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"operation" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"before" jsonb,
	"after" jsonb,
	"undone_at" timestamp with time zone,
	"undone_by" uuid,
	"undoes_entry_id" uuid,
	CONSTRAINT "action_log_operation_check" CHECK ("action_log"."operation" IN ('CREATE', 'UPDATE', 'DELETE', 'UNDO')),
	CONSTRAINT "action_log_resource_type_check" CHECK ("action_log"."resource_type" IN ('transaction', 'savings_account', 'category_budget', 'savings_goal'))
);
--> statement-breakpoint
ALTER TABLE "action_log" ADD CONSTRAINT "action_log_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_log" ADD CONSTRAINT "action_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_log" ADD CONSTRAINT "action_log_undone_by_users_id_fk" FOREIGN KEY ("undone_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_action_log_household_at" ON "action_log" USING btree ("household_id","at");