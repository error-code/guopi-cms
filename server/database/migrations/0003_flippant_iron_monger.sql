CREATE TABLE `nav_menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`label` text NOT NULL,
	`type` text DEFAULT 'link' NOT NULL,
	`ref_id` integer,
	`url` text,
	`new_tab` integer DEFAULT false NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
