DROP INDEX "category_budgets_household_name_key";--> statement-breakpoint
ALTER TABLE "activity_log" ALTER COLUMN "amount" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "category_budgets" ALTER COLUMN "monthly_limit" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "savings_accounts" ALTER COLUMN "amount" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "savings_goals" ALTER COLUMN "monthly_amount" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "savings_goals" ALTER COLUMN "monthly_amount" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "savings_goals" ALTER COLUMN "monthly_amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savings_goals" ALTER COLUMN "yearly_amount" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "savings_goals" ALTER COLUMN "yearly_amount" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "savings_goals" ALTER COLUMN "yearly_amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE text;