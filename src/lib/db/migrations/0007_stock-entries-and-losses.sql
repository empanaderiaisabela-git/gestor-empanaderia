CREATE TABLE "stock_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"provider_id" uuid,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_entries_quantity_check" CHECK ("stock_entries"."quantity" > 0),
	CONSTRAINT "stock_entries_unit_cost_check" CHECK ("stock_entries"."unit_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_losses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"quantity" numeric(10, 1) NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"reason" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_losses_quantity_check" CHECK ("stock_losses"."quantity" > 0 and "stock_losses"."quantity" * 2 = trunc("stock_losses"."quantity" * 2)),
	CONSTRAINT "stock_losses_unit_cost_check" CHECK ("stock_losses"."unit_cost" >= 0),
	CONSTRAINT "stock_losses_reason_check" CHECK (length(trim("stock_losses"."reason")) > 0)
);
--> statement-breakpoint
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_losses" ADD CONSTRAINT "stock_losses_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_losses" ADD CONSTRAINT "stock_losses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_entries_menu_item_id_idx" ON "stock_entries" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "stock_losses_menu_item_id_idx" ON "stock_losses" USING btree ("menu_item_id");