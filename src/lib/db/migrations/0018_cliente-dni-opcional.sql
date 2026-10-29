ALTER TABLE "customers" ALTER COLUMN "document_number" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "document_number" DROP NOT NULL;--> statement-breakpoint
UPDATE "customers" SET "document_number" = NULL WHERE trim("document_number") = '';
