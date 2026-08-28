CREATE TABLE "body_weight_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"measured_on" date NOT NULL,
	"weight_grams" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_features" (
	"user_id" uuid NOT NULL,
	"feature" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_features_pkey" PRIMARY KEY("user_id","feature")
);
--> statement-breakpoint
ALTER TABLE "body_weight_entries" ADD CONSTRAINT "body_weight_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "body_weight_entries_user_date_uq" ON "body_weight_entries" USING btree ("user_id","measured_on");--> statement-breakpoint
CREATE INDEX "body_weight_entries_user_date_idx" ON "body_weight_entries" USING btree ("user_id","measured_on");--> statement-breakpoint
CREATE INDEX "user_features_feature_idx" ON "user_features" USING btree ("feature");