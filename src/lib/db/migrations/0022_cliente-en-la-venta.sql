ALTER TABLE "sales" ALTER COLUMN "buyer_name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "address" varchar(150) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "buyer_phone" varchar(30);--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "buyer_address" varchar(150);