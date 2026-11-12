ALTER TABLE "sales" ADD COLUMN "checkout_key" uuid;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_checkout_key_unique" UNIQUE("checkout_key");