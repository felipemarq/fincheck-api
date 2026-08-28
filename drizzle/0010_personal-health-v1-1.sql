CREATE TABLE "daily_calorie_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"logged_on" date NOT NULL,
	"calories_consumed" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_health_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"target_weight_grams" integer,
	"target_date" date,
	"height_cm" integer,
	"birth_date" date,
	"calculation_sex" varchar(20),
	"activity_level" varchar(40),
	"daily_expenditure_override_kcal" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_calorie_entries" ADD CONSTRAINT "daily_calorie_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_health_profiles" ADD CONSTRAINT "personal_health_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_calorie_entries_user_date_uq" ON "daily_calorie_entries" USING btree ("user_id","logged_on");--> statement-breakpoint
CREATE INDEX "daily_calorie_entries_user_date_idx" ON "daily_calorie_entries" USING btree ("user_id","logged_on");