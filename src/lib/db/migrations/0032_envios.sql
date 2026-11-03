CREATE TABLE "shipping_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(60) NOT NULL,
	"detail" varchar(150) DEFAULT '' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_options_title_unique" UNIQUE("title"),
	CONSTRAINT "shipping_options_amount_check" CHECK ("shipping_options"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "shipping_option_id" uuid;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "shipping_title" varchar(60);--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "shipping_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_shipping_option_id_shipping_options_id_fk" FOREIGN KEY ("shipping_option_id") REFERENCES "public"."shipping_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_shipping_option_id_idx" ON "sales" USING btree ("shipping_option_id");--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_shipping_amount_check" CHECK ("sales"."shipping_amount" >= 0);--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_shipping_check" CHECK (("sales"."shipping_option_id" is null) = ("sales"."shipping_title" is null));