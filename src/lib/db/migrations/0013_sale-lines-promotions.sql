ALTER TABLE "sale_lines" ALTER COLUMN "menu_group" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_lines" ALTER COLUMN "presentation_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_lines" ADD COLUMN "promotion_id" uuid;--> statement-breakpoint
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_lines_promotion_id_idx" ON "sale_lines" USING btree ("promotion_id");--> statement-breakpoint
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_kind_check" CHECK (("sale_lines"."promotion_id" is null and "sale_lines"."menu_group" is not null and "sale_lines"."presentation_key" is not null)
        or ("sale_lines"."promotion_id" is not null and "sale_lines"."menu_group" is null and "sale_lines"."presentation_key" is null));