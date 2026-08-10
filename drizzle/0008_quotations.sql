CREATE TYPE "public"."quotation_status" AS ENUM('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "quotation_item_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"quotation_item_id" uuid NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"content_type" varchar(80) NOT NULL,
	"size" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_code" varchar(80),
	"description" text NOT NULL,
	"brand" varchar(120) NOT NULL,
	"specification" text,
	"unit" varchar(40) NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_price" numeric(16, 6) NOT NULL,
	"total" numeric(16, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"number" varchar(80) NOT NULL,
	"status" "quotation_status" DEFAULT 'DRAFT' NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"seller_name" varchar(160) NOT NULL,
	"seller_document" varchar(40),
	"seller_email" varchar(254),
	"seller_phone" varchar(40),
	"seller_address" text,
	"customer_legal_name" varchar(160) NOT NULL,
	"customer_trade_name" varchar(160),
	"customer_document" varchar(40) NOT NULL,
	"customer_email" varchar(254),
	"customer_phone" varchar(40),
	"customer_address" text,
	"payment_terms" text,
	"delivery_terms" text,
	"notes" text,
	"internal_notes" text,
	"subtotal" numeric(16, 2) NOT NULL,
	"freight" numeric(16, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"total" numeric(16, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotation_item_images" ADD CONSTRAINT "quotation_images_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_item_images" ADD CONSTRAINT "quotation_images_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_item_images" ADD CONSTRAINT "quotation_images_item_id_quotation_items_id_fk" FOREIGN KEY ("quotation_item_id") REFERENCES "public"."quotation_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quotation_images_entity_idx" ON "quotation_item_images" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "quotation_images_item_idx" ON "quotation_item_images" USING btree ("quotation_item_id");--> statement-breakpoint
CREATE INDEX "quotation_images_quotation_idx" ON "quotation_item_images" USING btree ("quotation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotation_images_storage_key_uq" ON "quotation_item_images" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "quotation_items_entity_idx" ON "quotation_items" USING btree ("entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotation_items_line_uq" ON "quotation_items" USING btree ("quotation_id","line_number");--> statement-breakpoint
CREATE INDEX "quotation_items_product_idx" ON "quotation_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "quotation_items_quotation_idx" ON "quotation_items" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotations_customer_idx" ON "quotations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "quotations_entity_issued_idx" ON "quotations" USING btree ("entity_id","issued_at");--> statement-breakpoint
CREATE INDEX "quotations_entity_status_idx" ON "quotations" USING btree ("entity_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_entity_number_uq" ON "quotations" USING btree ("entity_id","number");