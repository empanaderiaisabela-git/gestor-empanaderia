ALTER TABLE "promotion_components" DROP CONSTRAINT "promotion_components_unique";--> statement-breakpoint
ALTER TABLE "promotion_components" ADD COLUMN "menu_item_id" uuid;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_id_group_unique" UNIQUE("id","menu_group");--> statement-breakpoint
ALTER TABLE "promotion_components" ADD CONSTRAINT "promotion_components_menu_item_fk" FOREIGN KEY ("menu_item_id","menu_group") REFERENCES "public"."menu_items"("id","menu_group") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_components" ADD CONSTRAINT "promotion_components_unique" UNIQUE NULLS NOT DISTINCT("promotion_id","menu_group","presentation_key","menu_item_id");--> statement-breakpoint
ALTER TABLE "promotion_components" ADD CONSTRAINT "promotion_components_menu_item_check" CHECK ("promotion_components"."menu_item_id" is null or "promotion_components"."menu_group" in ('coca_cola', 'pepsi'));