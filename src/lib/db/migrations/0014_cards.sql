CREATE TABLE "card_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"installments" integer NOT NULL,
	"surcharge_pct" numeric(5, 2) NOT NULL,
	CONSTRAINT "card_plans_card_installments_unique" UNIQUE("card_id","installments"),
	CONSTRAINT "card_plans_installments_check" CHECK ("card_plans"."installments" in (1, 3, 6, 12)),
	CONSTRAINT "card_plans_surcharge_check" CHECK ("card_plans"."surcharge_pct" >= 0 and "card_plans"."surcharge_pct" <= 100)
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(40) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cards_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "card_plans" ADD CONSTRAINT "card_plans_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_plans_card_id_idx" ON "card_plans" USING btree ("card_id");