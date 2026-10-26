ALTER TABLE "sale_payments" ADD COLUMN "card_id" uuid;--> statement-breakpoint
ALTER TABLE "sale_payments" ADD COLUMN "installments" integer;--> statement-breakpoint
ALTER TABLE "sale_payments" ADD COLUMN "surcharge_pct" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "sale_payments" ADD COLUMN "surcharge_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_payments_card_id_idx" ON "sale_payments" USING btree ("card_id");--> statement-breakpoint
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_card_check" CHECK (("sale_payments"."card_id" is null and "sale_payments"."installments" is null and "sale_payments"."surcharge_pct" is null and "sale_payments"."surcharge_amount" is null)
        or ("sale_payments"."type"::text = 'credito' and "sale_payments"."card_id" is not null and "sale_payments"."installments" is not null and "sale_payments"."surcharge_pct" is not null and "sale_payments"."surcharge_amount" is not null
          and "sale_payments"."installments" in (1, 3, 6, 12) and "sale_payments"."surcharge_pct" >= 0 and "sale_payments"."surcharge_amount" >= 0));