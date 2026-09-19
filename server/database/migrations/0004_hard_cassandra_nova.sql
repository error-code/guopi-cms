CREATE TABLE `blocked_ips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip` text NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocked_ips_ip_unique` ON `blocked_ips` (`ip`);--> statement-breakpoint
CREATE TABLE `security_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip` text NOT NULL,
	`method` text NOT NULL,
	`path` text NOT NULL,
	`user_agent` text,
	`os` text,
	`browser` text,
	`event` text NOT NULL,
	`detail` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
