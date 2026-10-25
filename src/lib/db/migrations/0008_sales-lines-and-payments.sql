ALTER TYPE "public"."payment_type" ADD VALUE 'debito';--> statement-breakpoint
ALTER TYPE "public"."payment_type" ADD VALUE 'credito';--> statement-breakpoint
CREATE TABLE "sale_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_line_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"units" numeric(10, 1) NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	CONSTRAINT "sale_line_items_units_check" CHECK ("sale_line_items"."units" > 0),
	CONSTRAINT "sale_line_items_unit_cost_check" CHECK ("sale_line_items"."unit_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sale_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"menu_group" "menu_group" NOT NULL,
	"presentation_key" varchar(10) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"description" varchar(255) NOT NULL,
	CONSTRAINT "sale_lines_quantity_check" CHECK ("sale_lines"."quantity" > 0),
	CONSTRAINT "sale_lines_unit_price_check" CHECK ("sale_lines"."unit_price" >= 0),
	CONSTRAINT "sale_lines_subtotal_check" CHECK ("sale_lines"."subtotal" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "buyer_name" varchar(60);--> statement-breakpoint
ALTER TABLE "sale_line_items" ADD CONSTRAINT "sale_line_items_sale_line_id_sale_lines_id_fk" FOREIGN KEY ("sale_line_id") REFERENCES "public"."sale_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_line_items" ADD CONSTRAINT "sale_line_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_line_items_sale_line_id_idx" ON "sale_line_items" USING btree ("sale_line_id");--> statement-breakpoint
CREATE INDEX "sale_line_items_menu_item_id_idx" ON "sale_line_items" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "sale_lines_sale_id_idx" ON "sale_lines" USING btree ("sale_id");