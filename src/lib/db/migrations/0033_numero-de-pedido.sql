ALTER TABLE "sales" ADD COLUMN "order_number" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_order_number_unique" UNIQUE("order_number");