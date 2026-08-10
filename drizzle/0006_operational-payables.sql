CREATE TYPE "public"."payable_status" AS ENUM('OPEN', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"holder_name" varchar(160) NOT NULL,
	"bank" varchar(120) NOT NULL,
	"brand" varchar(40) NOT NULL,
	"last_four" varchar(4) NOT NULL,
	"color" varchar(7) DEFAULT '#868e96' NOT NULL,
	"closing_day" integer NOT NULL,
	"due_day" integer NOT NULL,
	"credit_limit" numeric(16, 2),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"acquisition_id" uuid NOT NULL,
	"credit_card_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"description" varchar(240) NOT NULL,
	"payment_method" varchar(80) NOT NULL,
	"installment_number" integer DEFAULT 1 NOT NULL,
	"installment_count" integer DEFAULT 1 NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" "payable_status" DEFAULT 'OPEN' NOT NULL,
	"paid_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acquisitions" ADD COLUMN "credit_card_id" uuid;--> statement-breakpoint
ALTER TABLE "acquisitions" ADD COLUMN "installment_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "acquisitions" ADD COLUMN "first_payment_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables" ADD CONSTRAINT "payables_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables" ADD CONSTRAINT "payables_acquisition_id_acquisitions_id_fk" FOREIGN KEY ("acquisition_id") REFERENCES "public"."acquisitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables" ADD CONSTRAINT "payables_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables" ADD CONSTRAINT "payables_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables" ADD CONSTRAINT "payables_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_cards_entity_active_idx" ON "credit_cards" USING btree ("entity_id" uuid_ops,"active" bool_ops);--> statement-breakpoint
CREATE INDEX "credit_cards_entity_idx" ON "credit_cards" USING btree ("entity_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "credit_cards_identity_uq" ON "credit_cards" USING btree ("entity_id","bank","last_four");--> statement-breakpoint
CREATE INDEX "payables_card_due_idx" ON "payables" USING btree ("credit_card_id" uuid_ops,"due_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "payables_entity_due_idx" ON "payables" USING btree ("entity_id" uuid_ops,"due_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "payables_entity_status_idx" ON "payables" USING btree ("entity_id" uuid_ops,"status" enum_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payables_acquisition_installment_uq" ON "payables" USING btree ("acquisition_id","installment_number");--> statement-breakpoint
ALTER TABLE "acquisitions" ADD CONSTRAINT "acquisitions_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE restrict ON UPDATE no action;
