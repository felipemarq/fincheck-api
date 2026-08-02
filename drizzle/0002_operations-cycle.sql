CREATE TYPE "public"."acquisition_receipt_status" AS ENUM('CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."receivable_payment_status" AS ENUM('CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "acquisition_receipt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"receipt_id" uuid NOT NULL,
	"acquisition_item_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"received_quantity" numeric(14, 3) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acquisition_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"acquisition_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"status" "acquisition_receipt_status" DEFAULT 'CONFIRMED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"status" "delivery_status" DEFAULT 'PREPARING' NOT NULL,
	"dispatched_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"recipient_name" varchar(160),
	"tracking_code" varchar(160),
	"freight_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"delivery_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"delivered_quantity" numeric(14, 3) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"invoiced_quantity" numeric(14, 3) NOT NULL,
	"unit_price" numeric(16, 6) NOT NULL,
	"total_amount" numeric(16, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"invoice_number" varchar(120) NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"gross_amount" numeric(16, 2) NOT NULL,
	"tax_amount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"other_deductions" numeric(16, 2) DEFAULT '0' NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receivable_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"payment_method" varchar(80) NOT NULL,
	"reference" varchar(160),
	"status" "receivable_payment_status" DEFAULT 'CONFIRMED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acquisition_receipt_items" ADD CONSTRAINT "acquisition_receipt_items_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_receipt_items" ADD CONSTRAINT "acquisition_receipt_items_receipt_id_acquisition_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."acquisition_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_receipt_items" ADD CONSTRAINT "acquisition_receipt_items_acquisition_item_id_acquisition_items_id_fk" FOREIGN KEY ("acquisition_item_id") REFERENCES "public"."acquisition_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_receipt_items" ADD CONSTRAINT "acquisition_receipt_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_receipts" ADD CONSTRAINT "acquisition_receipts_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_receipts" ADD CONSTRAINT "acquisition_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_receipts" ADD CONSTRAINT "acquisition_receipts_acquisition_id_acquisitions_id_fk" FOREIGN KEY ("acquisition_id") REFERENCES "public"."acquisitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_receipts" ADD CONSTRAINT "acquisition_receipts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_receipts" ADD CONSTRAINT "acquisition_receipts_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acquisition_receipt_items_entity_idx" ON "acquisition_receipt_items" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "acquisition_receipt_items_receipt_idx" ON "acquisition_receipt_items" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "acquisition_receipt_items_acquisition_item_idx" ON "acquisition_receipt_items" USING btree ("acquisition_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "acquisition_receipt_items_item_uq" ON "acquisition_receipt_items" USING btree ("receipt_id","acquisition_item_id");--> statement-breakpoint
CREATE INDEX "acquisition_receipts_entity_idx" ON "acquisition_receipts" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "acquisition_receipts_order_idx" ON "acquisition_receipts" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "acquisition_receipts_acquisition_idx" ON "acquisition_receipts" USING btree ("acquisition_id");--> statement-breakpoint
CREATE INDEX "acquisition_receipts_entity_date_idx" ON "acquisition_receipts" USING btree ("entity_id","received_at");--> statement-breakpoint
CREATE INDEX "deliveries_entity_idx" ON "deliveries" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "deliveries_order_idx" ON "deliveries" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "deliveries_entity_status_idx" ON "deliveries" USING btree ("entity_id","status");--> statement-breakpoint
CREATE INDEX "delivery_items_entity_idx" ON "delivery_items" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "delivery_items_delivery_idx" ON "delivery_items" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "delivery_items_order_item_idx" ON "delivery_items" USING btree ("purchase_order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_items_item_uq" ON "delivery_items" USING btree ("delivery_id","purchase_order_item_id");--> statement-breakpoint
CREATE INDEX "invoice_items_entity_idx" ON "invoice_items" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_items_order_item_idx" ON "invoice_items" USING btree ("purchase_order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_items_item_uq" ON "invoice_items" USING btree ("invoice_id","purchase_order_item_id");--> statement-breakpoint
CREATE INDEX "invoices_entity_idx" ON "invoices" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "invoices_order_idx" ON "invoices" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "invoices_entity_due_idx" ON "invoices" USING btree ("entity_id","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_uq" ON "invoices" USING btree ("entity_id","invoice_number");--> statement-breakpoint
CREATE INDEX "receivable_payments_entity_idx" ON "receivable_payments" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "receivable_payments_order_idx" ON "receivable_payments" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "receivable_payments_invoice_idx" ON "receivable_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "receivable_payments_entity_date_idx" ON "receivable_payments" USING btree ("entity_id","received_at");