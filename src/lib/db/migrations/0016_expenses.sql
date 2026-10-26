CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(30) NOT NULL,
	"title" varchar(100) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"invoice_date" date NOT NULL,
	"user_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "expenses_amount_check" CHECK ("expenses"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_invoice_date_idx" ON "expenses" USING btree ("invoice_date");