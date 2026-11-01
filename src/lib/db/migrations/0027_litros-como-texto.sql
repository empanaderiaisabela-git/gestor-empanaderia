ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_drink_check";--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "drink_size" varchar(10);--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_drink_check" CHECK (("menu_items"."drink_name" is null and "menu_items"."liters" is null and "menu_items"."drink_size" is null and "menu_items"."flavor" is null)
        or ("menu_items"."menu_group" in ('coca_cola', 'pepsi') and "menu_items"."drink_name" is not null and ("menu_items"."liters" > 0 or "menu_items"."drink_size" is not null)));