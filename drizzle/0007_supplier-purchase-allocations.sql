CREATE TABLE "acquisition_item_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"acquisition_item_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"allocated_quantity" numeric(14, 3) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acquisition_items" DROP CONSTRAINT "acquisition_items_purchase_order_item_id_purchase_order_items_i";
--> statement-breakpoint
DROP INDEX "acquisition_items_order_item_idx";--> statement-breakpoint
DROP INDEX "acquisition_items_order_item_uq";--> statement-breakpoint
DROP INDEX "acquisition_receipt_items_item_uq";--> statement-breakpoint
ALTER TABLE "acquisitions" ALTER COLUMN "purchase_order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "acquisition_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
UPDATE "acquisition_items" AS acquisition_item
SET "product_id" = order_item."product_id"
FROM "purchase_order_items" AS order_item
WHERE order_item."id" = acquisition_item."purchase_order_item_id";--> statement-breakpoint
INSERT INTO "acquisition_item_allocations" (
	"id",
	"entity_id",
	"acquisition_item_id",
	"purchase_order_item_id",
	"allocated_quantity",
	"created_at",
	"updated_at"
)
SELECT
	gen_random_uuid(),
	"entity_id",
	"id",
	"purchase_order_item_id",
	"acquired_quantity",
	"created_at",
	"updated_at"
FROM "acquisition_items";--> statement-breakpoint
ALTER TABLE "acquisition_items" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "acquisition_item_allocations" ADD CONSTRAINT "acquisition_item_allocations_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_item_allocations" ADD CONSTRAINT "acquisition_item_allocations_acquisition_item_id_items_id_fk" FOREIGN KEY ("acquisition_item_id") REFERENCES "public"."acquisition_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_item_allocations" ADD CONSTRAINT "acquisition_item_allocations_order_item_id_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acquisition_allocations_acquisition_item_idx" ON "acquisition_item_allocations" USING btree ("acquisition_item_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "acquisition_allocations_entity_idx" ON "acquisition_item_allocations" USING btree ("entity_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "acquisition_allocations_order_item_idx" ON "acquisition_item_allocations" USING btree ("purchase_order_item_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "acquisition_allocations_item_order_uq" ON "acquisition_item_allocations" USING btree ("acquisition_item_id","purchase_order_item_id");--> statement-breakpoint
ALTER TABLE "acquisition_items" ADD CONSTRAINT "acquisition_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acquisition_items_product_idx" ON "acquisition_items" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "acquisition_receipt_items_item_uq" ON "acquisition_receipt_items" USING btree ("receipt_id" uuid_ops,"acquisition_item_id" uuid_ops,"purchase_order_item_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "acquisition_items" DROP COLUMN "purchase_order_item_id";
