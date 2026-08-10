ALTER TABLE "products" ADD COLUMN "code" varchar(80);--> statement-breakpoint
CREATE UNIQUE INDEX "products_entity_code_uq" ON "products" USING btree ("entity_id","code");