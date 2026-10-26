CREATE TABLE "promotion_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_id" uuid NOT NULL,
	"menu_group" "menu_group" NOT NULL,
	"presentation_key" varchar(10) NOT NULL,
	"quantity" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "promotion_components_unique" UNIQUE("promotion_id","menu_group","presentation_key"),
	CONSTRAINT "promotion_components_quantity_check" CHECK ("promotion_components"."quantity" > 0),
	CONSTRAINT "promotion_components_position_check" CHECK ("promotion_components"."position" >= 0),
	CONSTRAINT "promotion_components_presentation_check" CHECK (case
        when "promotion_components"."menu_group" in ('empanadas', 'sanguches') then "promotion_components"."presentation_key" in ('u1', 'u3', 'u6', 'u12')
        when "promotion_components"."menu_group" = 'pizzas' then "promotion_components"."presentation_key" in ('pizza_1', 'pizza_2')
        else "promotion_components"."presentation_key" = 'u1' end)
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(60) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_name_unique" UNIQUE("name"),
	CONSTRAINT "promotions_price_check" CHECK ("promotions"."price" > 0)
);
--> statement-breakpoint
ALTER TABLE "promotion_components" ADD CONSTRAINT "promotion_components_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promotion_components_promotion_id_idx" ON "promotion_components" USING btree ("promotion_id");