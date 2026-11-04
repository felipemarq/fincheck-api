ALTER TABLE "invoice_items" ALTER COLUMN "purchase_order_item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "purchase_order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "receivable_payments" ALTER COLUMN "purchase_order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "line_number" integer;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "original_unit" varchar(40);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
-- Preserve the client and fiscal description of every existing invoice. The nullable
-- columns also allow older OC handlers to coexist during the additive rollout.
UPDATE "invoices" AS i SET "customer_id" = o."customer_id"
FROM "purchase_orders" AS o
WHERE i."purchase_order_id" = o."id" AND i."entity_id" = o."entity_id";--> statement-breakpoint
UPDATE "invoice_items" AS i
SET "line_number" = o."line_number", "description" = o."description", "original_unit" = o."original_unit"
FROM "purchase_order_items" AS o
WHERE i."purchase_order_item_id" = o."id" AND i."entity_id" = o."entity_id";--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("entity_id","customer_id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_description_required" CHECK ("invoice_items"."purchase_order_item_id" is not null or (length(trim("invoice_items"."description")) > 0 and length(trim("invoice_items"."original_unit")) > 0 and "invoice_items"."description" is not null and "invoice_items"."original_unit" is not null));--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_required" CHECK ("invoices"."customer_id" is not null or "invoices"."purchase_order_id" is not null);
