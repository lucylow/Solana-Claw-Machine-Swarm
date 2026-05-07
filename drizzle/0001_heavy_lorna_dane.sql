CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` int,
	`event_type` varchar(128) NOT NULL,
	`description` text,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(128) NOT NULL,
	`status` enum('active','inactive','paused') DEFAULT 'inactive',
	`description` text,
	`onchain_address` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `claw_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`openclaw_compatible` int DEFAULT 0,
	`manifest_url` text,
	`onchain_metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `claw_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onchain_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` int,
	`receipt_type` enum('plan','execution','reflection','memory'),
	`content` text,
	`transaction_hash` varchar(128),
	`onchain_address` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onchain_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solana_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`wallet_address` varchar(64) NOT NULL,
	`nonce` varchar(128) NOT NULL,
	`signature` text,
	`is_verified` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `solana_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `solana_sessions_wallet_address_unique` UNIQUE(`wallet_address`)
);
