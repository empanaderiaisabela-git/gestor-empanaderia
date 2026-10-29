ALTER TABLE "menu_items" ADD COLUMN "is_base" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "menu_items_one_base_per_group" ON "menu_items" USING btree ("menu_group") WHERE "menu_items"."is_base";--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_base_check" CHECK (not "menu_items"."is_base" or ("menu_items"."unit_cost" is null and "menu_items"."price_1" is null and "menu_items"."price_3" is null and "menu_items"."price_6" is null and "menu_items"."price_12" is null
        and "menu_items"."menu_group" in ('pizzas', 'ciabattas') and "menu_items"."stock" = trunc("menu_items"."stock")));--> statement-breakpoint
INSERT INTO "menu_items" ("menu_group", "name", "is_base") VALUES ('pizzas', 'Prepizza', true), ('ciabattas', 'Pan de ciabatta', true);--> statement-breakpoint
UPDATE "menu_items" SET "stock" = 0 WHERE "menu_group" IN ('pizzas', 'ciabattas') AND NOT "is_base";
