ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_unit_cost_check";--> statement-breakpoint
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_prices_check";--> statement-breakpoint
ALTER TABLE "menu_items" ALTER COLUMN "unit_cost" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_unit_cost_check" CHECK ("menu_items"."unit_cost" is null or "menu_items"."unit_cost" >= 0);--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_prices_check" CHECK (case
        when "menu_items"."menu_group" in ('empanadas', 'ciabattas')
          then "menu_items"."price_1" is null and "menu_items"."price_3" is null and "menu_items"."price_6" is null and "menu_items"."price_12" is null
        when "menu_items"."menu_group" = 'sanguches'
          then ("menu_items"."price_1" is null and "menu_items"."price_3" is null and "menu_items"."price_6" is null and "menu_items"."price_12" is null)
            or (coalesce("menu_items"."price_1", 0) > 0 and coalesce("menu_items"."price_3", 0) > 0 and coalesce("menu_items"."price_6", 0) > 0 and coalesce("menu_items"."price_12", 0) > 0)
        else ("menu_items"."price_1" is null or "menu_items"."price_1" > 0) and "menu_items"."price_3" is null and "menu_items"."price_6" is null and "menu_items"."price_12" is null end);