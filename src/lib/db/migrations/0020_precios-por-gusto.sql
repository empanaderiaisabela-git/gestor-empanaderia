ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_prices_check";--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_prices_check" CHECK (case
        when "menu_items"."menu_group" in ('empanadas', 'sanguches')
          then ("menu_items"."price_1" is null and "menu_items"."price_3" is null and "menu_items"."price_6" is null and "menu_items"."price_12" is null)
            or (coalesce("menu_items"."price_1", 0) > 0 and coalesce("menu_items"."price_3", 0) > 0 and coalesce("menu_items"."price_6", 0) > 0 and coalesce("menu_items"."price_12", 0) > 0)
        else ("menu_items"."price_1" is null or "menu_items"."price_1" > 0) and "menu_items"."price_3" is null and "menu_items"."price_6" is null and "menu_items"."price_12" is null end);--> statement-breakpoint
UPDATE "menu_items" SET "price_1" = g."price_1", "price_3" = g."price_3", "price_6" = g."price_6", "price_12" = g."price_12" FROM "menu_group_prices" g WHERE "menu_items"."menu_group" = g."menu_group";--> statement-breakpoint
DROP TABLE "menu_group_prices" CASCADE;