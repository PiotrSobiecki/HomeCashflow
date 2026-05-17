ALTER TABLE "category_budgets" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "category_budgets" ADD CONSTRAINT "category_budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;