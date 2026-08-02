CREATE TYPE "public"."acquisition_status" AS ENUM('PLACED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "acquisition_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"acquisition_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"acquired_quantity" numeric(14, 3) NOT NULL,
	"cost_unit_price" numeric(16, 6) NOT NULL,
	"line_discount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"total_cost" numeric(16, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acquisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"seller_name" varchar(160),
	"seller_document" varchar(40),
	"channel" varchar(120),
	"seller_order_number" varchar(120),
	"purchased_at" timestamp with time zone NOT NULL,
	"buyer_name" varchar(160) NOT NULL,
	"payment_method" varchar(80) NOT NULL,
	"payment_instrument" varchar(120),
	"payment_holder" varchar(160),
	"shipping_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"general_discount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"other_expenses" numeric(16, 2) DEFAULT '0' NOT NULL,
	"status" "acquisition_status" DEFAULT 'PLACED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acquisition_items" ADD CONSTRAINT "acquisition_items_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_items" ADD CONSTRAINT "acquisition_items_acquisition_id_acquisitions_id_fk" FOREIGN KEY ("acquisition_id") REFERENCES "public"."acquisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_items" ADD CONSTRAINT "acquisition_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisitions" ADD CONSTRAINT "acquisitions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisitions" ADD CONSTRAINT "acquisitions_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisitions" ADD CONSTRAINT "acquisitions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisitions" ADD CONSTRAINT "acquisitions_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acquisition_items_entity_idx" ON "acquisition_items" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "acquisition_items_acquisition_idx" ON "acquisition_items" USING btree ("acquisition_id");--> statement-breakpoint
CREATE INDEX "acquisition_items_order_item_idx" ON "acquisition_items" USING btree ("purchase_order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "acquisition_items_order_item_uq" ON "acquisition_items" USING btree ("acquisition_id","purchase_order_item_id");--> statement-breakpoint
CREATE INDEX "acquisitions_entity_idx" ON "acquisitions" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "acquisitions_order_idx" ON "acquisitions" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "acquisitions_entity_purchased_at_idx" ON "acquisitions" USING btree ("entity_id","purchased_at");