ALTER TABLE `measurement_answers` ADD `reserved_cost_hundredths` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `measurement_answers` ADD `post_cost_usd` text;--> statement-breakpoint
ALTER TABLE `measurement_answers` ADD `get_costs_usd` text;