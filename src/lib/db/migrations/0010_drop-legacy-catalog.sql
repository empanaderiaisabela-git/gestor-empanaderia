DROP TABLE "devices" CASCADE;--> statement-breakpoint
DROP TABLE "product_images" CASCADE;--> statement-breakpoint
DROP TABLE "product_losses" CASCADE;--> statement-breakpoint
DROP TABLE "products" CASCADE;--> statement-breakpoint
DROP TABLE "sale_items" CASCADE;--> statement-breakpoint
DELETE FROM "sale_payments" WHERE "sale_id" NOT IN (SELECT "sale_id" FROM "sale_lines");--> statement-breakpoint
DELETE FROM "sales" WHERE "id" NOT IN (SELECT "sale_id" FROM "sale_lines");
