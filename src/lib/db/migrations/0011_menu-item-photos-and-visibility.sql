CREATE TABLE "menu_item_images" (
	"public_id" varchar(255) PRIMARY KEY NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "is_visible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_item_images" ADD CONSTRAINT "menu_item_images_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menu_item_images_menu_item_id_idx" ON "menu_item_images" USING btree ("menu_item_id");