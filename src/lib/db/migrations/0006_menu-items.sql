CREATE TYPE "public"."menu_group" AS ENUM('empanadas', 'pizzas', 'sanguches', 'ciabattas', 'coca_cola', 'pepsi');--> statement-breakpoint
CREATE TABLE "menu_group_prices" (
	"menu_group" "menu_group" PRIMARY KEY NOT NULL,
	"price_1" numeric(10, 2) NOT NULL,
	"price_3" numeric(10, 2),
	"price_6" numeric(10, 2),
	"price_12" numeric(10, 2),
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_group_prices_check" CHECK (case
        when "menu_group_prices"."menu_group" = 'empanadas'
          then "menu_group_prices"."price_1" > 0 and coalesce("menu_group_prices"."price_3", 0) > 0 and coalesce("menu_group_prices"."price_6", 0) > 0 and coalesce("menu_group_prices"."price_12", 0) > 0
        when "menu_group_prices"."menu_group" = 'ciabattas'
          then "menu_group_prices"."price_1" > 0 and "menu_group_prices"."price_3" is null and "menu_group_prices"."price_6" is null and "menu_group_prices"."price_12" is null
        else false end)
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_group" "menu_group" NOT NULL,
	"name" varchar(60) NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"stock" numeric(10, 1) DEFAULT '0' NOT NULL,
	"price_1" numeric(10, 2),
	"price_3" numeric(10, 2),
	"price_6" numeric(10, 2),
	"price_12" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_items_group_name_unique" UNIQUE("menu_group","name"),
	CONSTRAINT "menu_items_unit_cost_check" CHECK ("menu_items"."unit_cost" >= 0),
	CONSTRAINT "menu_items_stock_check" CHECK ("menu_items"."stock" >= 0 and "menu_items"."stock" * 2 = trunc("menu_items"."stock" * 2)),
	CONSTRAINT "menu_items_whole_stock_check" CHECK ("menu_items"."menu_group" = 'pizzas' or "menu_items"."stock" = trunc("menu_items"."stock")),
	CONSTRAINT "menu_items_prices_check" CHECK (case
        when "menu_items"."menu_group" in ('empanadas', 'ciabattas')
          then "menu_items"."price_1" is null and "menu_items"."price_3" is null and "menu_items"."price_6" is null and "menu_items"."price_12" is null
        when "menu_items"."menu_group" = 'sanguches'
          then coalesce("menu_items"."price_1", 0) > 0 and coalesce("menu_items"."price_3", 0) > 0 and coalesce("menu_items"."price_6", 0) > 0 and coalesce("menu_items"."price_12", 0) > 0
        else coalesce("menu_items"."price_1", 0) > 0 and "menu_items"."price_3" is null and "menu_items"."price_6" is null and "menu_items"."price_12" is null end)
);
