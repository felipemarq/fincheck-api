CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"name" varchar(240) NOT NULL,
	"brand" varchar(120) DEFAULT 'Outros' NOT NULL,
	"specification" text,
	"packaging" varchar(40) NOT NULL,
	"normalized_unit" varchar(40) DEFAULT 'UNIT' NOT NULL,
	"last_purchase_price" numeric(16, 6),
	"last_purchase_source" varchar(160),
	"last_purchased_at" timestamp with time zone,
	"last_sale_price" numeric(16, 6),
	"last_sold_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_entity_idx" ON "products" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "products_entity_active_idx" ON "products" USING btree ("entity_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "products_identity_uq" ON "products" USING btree ("entity_id","name","brand","packaging");--> statement-breakpoint
WITH catalog_source AS (
	SELECT DISTINCT ON (
		poi."entity_id",
		lower(trim(left(poi."description", 240))),
		lower(COALESCE(NULLIF(trim(poi."brand"), ''), 'Outros')),
		upper(trim(poi."original_unit"))
	)
		poi."entity_id",
		po."created_by_user_id",
		po."updated_by_user_id",
		left(trim(poi."description"), 240) AS "name",
		left(COALESCE(NULLIF(trim(poi."brand"), ''), 'Outros'), 120) AS "brand",
		poi."specification",
		left(upper(trim(poi."original_unit")), 40) AS "packaging",
		left(upper(trim(poi."normalized_unit")), 40) AS "normalized_unit",
		poi."sale_unit_price" AS "last_sale_price",
		po."issued_at" AS "last_sold_at"
	FROM "purchase_order_items" poi
	INNER JOIN "purchase_orders" po ON po."id" = poi."purchase_order_id"
	ORDER BY
		poi."entity_id",
		lower(trim(left(poi."description", 240))),
		lower(COALESCE(NULLIF(trim(poi."brand"), ''), 'Outros')),
		upper(trim(poi."original_unit")),
		po."issued_at" DESC,
		poi."created_at" DESC
)
INSERT INTO "products" (
	"entity_id",
	"created_by_user_id",
	"updated_by_user_id",
	"name",
	"brand",
	"specification",
	"packaging",
	"normalized_unit",
	"last_sale_price",
	"last_sold_at"
)
SELECT
	"entity_id",
	"created_by_user_id",
	"updated_by_user_id",
	"name",
	"brand",
	"specification",
	"packaging",
	"normalized_unit",
	"last_sale_price",
	"last_sold_at"
FROM catalog_source;--> statement-breakpoint
UPDATE "purchase_order_items" poi
SET "product_id" = product."id"
FROM "products" product
WHERE product."entity_id" = poi."entity_id"
	AND lower(trim(product."name")) = lower(trim(left(poi."description", 240)))
	AND lower(trim(product."brand")) = lower(COALESCE(NULLIF(trim(poi."brand"), ''), 'Outros'))
	AND upper(trim(product."packaging")) = upper(trim(poi."original_unit"));--> statement-breakpoint
ALTER TABLE "purchase_order_items" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_order_items_product_idx" ON "purchase_order_items" USING btree ("product_id");
