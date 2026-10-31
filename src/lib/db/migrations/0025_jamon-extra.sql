CREATE TABLE "pizza_extras" (
	"code" varchar(20) PRIMARY KEY NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pizza_extras_code_check" CHECK ("pizza_extras"."code" = 'jamon'),
	CONSTRAINT "pizza_extras_price_check" CHECK ("pizza_extras"."price" > 0)
);
