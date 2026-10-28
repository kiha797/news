CREATE TABLE `visitor_admin_attempts` (
	`ip_address` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`failures` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `daily_visitors` ADD `ip_address` text;--> statement-breakpoint
ALTER TABLE `daily_visitors` ADD `visited_at` text;