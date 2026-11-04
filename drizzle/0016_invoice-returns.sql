ALTER TABLE invoices ADD COLUMN operation_type varchar(30) DEFAULT 'SALE' NOT NULL;
--> statement-breakpoint
ALTER TABLE invoices ADD COLUMN referenced_invoice_id uuid;
--> statement-breakpoint
CREATE UNIQUE INDEX invoices_entity_id_uq ON invoices(entity_id,id);
--> statement-breakpoint
CREATE INDEX invoices_reference_idx ON invoices(entity_id,referenced_invoice_id);
--> statement-breakpoint
ALTER TABLE invoices ADD CONSTRAINT invoices_operation_type_valid CHECK (operation_type IN ('SALE','SALES_RETURN','PURCHASE_RETURN'));
--> statement-breakpoint
ALTER TABLE invoices ADD CONSTRAINT invoices_reference_valid CHECK (referenced_invoice_id IS NULL OR (operation_type='SALES_RETURN' AND referenced_invoice_id<>id));
--> statement-breakpoint
ALTER TABLE invoices ADD CONSTRAINT invoices_reference_entity_fk FOREIGN KEY (entity_id,referenced_invoice_id) REFERENCES invoices(entity_id,id) ON DELETE RESTRICT;
