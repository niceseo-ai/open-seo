ALTER TABLE "measurement_answers" ADD COLUMN "reserved_cost_hundredths" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "measurement_answers" ADD COLUMN "post_cost_usd" text;--> statement-breakpoint
ALTER TABLE "measurement_answers" ADD COLUMN "get_costs_usd" text;