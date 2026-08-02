import { pgTable, index, foreignKey, uuid, varchar, timestamp, text, numeric, integer, unique, uniqueIndex, boolean, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const acquisitionReceiptStatus = pgEnum("acquisition_receipt_status", ['CONFIRMED', 'CANCELLED'])

export const acquisitionStatus = pgEnum("acquisition_status", ['PLACED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'])

export const deliveryStatus = pgEnum("delivery_status", ['PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])

export const entityType = pgEnum("entity_type", ['PF', 'PJ'])

export const invoiceStatus = pgEnum("invoice_status", ['DRAFT', 'ISSUED', 'CANCELLED'])

export const purchaseOrderLifecycleStatus = pgEnum("purchase_order_lifecycle_status", ['DRAFT', 'ACTIVE', 'CANCELLED'])

export const receivablePaymentStatus = pgEnum("receivable_payment_status", ['CONFIRMED', 'CANCELLED'])



export const entitiesTable = pgTable("entities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerUserId: uuid("owner_user_id").notNull(),
	name: varchar({ length: 120 }).notNull(),
	type: entityType().default('PF').notNull(),
	color: varchar({ length: 7 }).default('#228be6').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("entities_owner_idx").using("btree", table.ownerUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ownerUserId],
			foreignColumns: [usersTable.id],
			name: "entities_owner_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const usersTable = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	externalId: varchar({ length: 255 }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const receivablePaymentsTable = pgTable("receivable_payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	purchaseOrderId: uuid("purchase_order_id").notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
	amount: numeric({ precision: 16, scale:  2 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 80 }).notNull(),
	reference: varchar({ length: 160 }),
	status: receivablePaymentStatus().default('CONFIRMED').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("receivable_payments_entity_date_idx").using("btree", table.entityId.asc().nullsLast().op("timestamptz_ops"), table.receivedAt.asc().nullsLast().op("uuid_ops")),
	index("receivable_payments_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("receivable_payments_invoice_idx").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	index("receivable_payments_order_idx").using("btree", table.purchaseOrderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "receivable_payments_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrdersTable.id],
			name: "receivable_payments_purchase_order_id_purchase_orders_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoicesTable.id],
			name: "receivable_payments_invoice_id_invoices_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "receivable_payments_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "receivable_payments_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const acquisitionsTable = pgTable("acquisitions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	purchaseOrderId: uuid("purchase_order_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	sellerName: varchar("seller_name", { length: 160 }),
	sellerDocument: varchar("seller_document", { length: 40 }),
	channel: varchar({ length: 120 }),
	sellerOrderNumber: varchar("seller_order_number", { length: 120 }),
	purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull(),
	buyerName: varchar("buyer_name", { length: 160 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 80 }).notNull(),
	paymentInstrument: varchar("payment_instrument", { length: 120 }),
	paymentHolder: varchar("payment_holder", { length: 160 }),
	shippingCost: numeric("shipping_cost", { precision: 16, scale:  2 }).default('0').notNull(),
	generalDiscount: numeric("general_discount", { precision: 16, scale:  2 }).default('0').notNull(),
	otherExpenses: numeric("other_expenses", { precision: 16, scale:  2 }).default('0').notNull(),
	status: acquisitionStatus().default('PLACED').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("acquisitions_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("acquisitions_entity_purchased_at_idx").using("btree", table.entityId.asc().nullsLast().op("timestamptz_ops"), table.purchasedAt.asc().nullsLast().op("uuid_ops")),
	index("acquisitions_order_idx").using("btree", table.purchaseOrderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "acquisitions_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrdersTable.id],
			name: "acquisitions_purchase_order_id_purchase_orders_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "acquisitions_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "acquisitions_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const acquisitionReceiptsTable = pgTable("acquisition_receipts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	purchaseOrderId: uuid("purchase_order_id").notNull(),
	acquisitionId: uuid("acquisition_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
	status: acquisitionReceiptStatus().default('CONFIRMED').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("acquisition_receipts_acquisition_idx").using("btree", table.acquisitionId.asc().nullsLast().op("uuid_ops")),
	index("acquisition_receipts_entity_date_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops"), table.receivedAt.asc().nullsLast().op("uuid_ops")),
	index("acquisition_receipts_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("acquisition_receipts_order_idx").using("btree", table.purchaseOrderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "acquisition_receipts_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrdersTable.id],
			name: "acquisition_receipts_purchase_order_id_purchase_orders_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.acquisitionId],
			foreignColumns: [acquisitionsTable.id],
			name: "acquisition_receipts_acquisition_id_acquisitions_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "acquisition_receipts_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "acquisition_receipts_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const customersTable = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	legalName: varchar("legal_name", { length: 160 }).notNull(),
	tradeName: varchar("trade_name", { length: 160 }),
	document: varchar({ length: 40 }).notNull(),
	email: varchar({ length: 254 }),
	phone: varchar({ length: 40 }),
	billingAddress: text("billing_address"),
	deliveryAddress: text("delivery_address"),
	notes: text(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("customers_entity_document_uq").using("btree", table.entityId.asc().nullsLast().op("text_ops"), table.document.asc().nullsLast().op("text_ops")),
	index("customers_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "customers_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "customers_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "customers_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const acquisitionReceiptItemsTable = pgTable("acquisition_receipt_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	receiptId: uuid("receipt_id").notNull(),
	acquisitionItemId: uuid("acquisition_item_id").notNull(),
	purchaseOrderItemId: uuid("purchase_order_item_id").notNull(),
	receivedQuantity: numeric("received_quantity", { precision: 14, scale:  3 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("acquisition_receipt_items_acquisition_item_idx").using("btree", table.acquisitionItemId.asc().nullsLast().op("uuid_ops")),
	index("acquisition_receipt_items_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("acquisition_receipt_items_item_uq").using("btree", table.receiptId.asc().nullsLast().op("uuid_ops"), table.acquisitionItemId.asc().nullsLast().op("uuid_ops")),
	index("acquisition_receipt_items_receipt_idx").using("btree", table.receiptId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "acquisition_receipt_items_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.receiptId],
			foreignColumns: [acquisitionReceiptsTable.id],
			name: "acquisition_receipt_items_receipt_id_acquisition_receipts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.acquisitionItemId],
			foreignColumns: [acquisitionItemsTable.id],
			name: "acquisition_receipt_items_acquisition_item_id_acquisition_items"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.purchaseOrderItemId],
			foreignColumns: [purchaseOrderItemsTable.id],
			name: "acquisition_receipt_items_purchase_order_item_id_purchase_order"
		}).onDelete("restrict"),
]);

export const deliveriesTable = pgTable("deliveries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	purchaseOrderId: uuid("purchase_order_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	status: deliveryStatus().default('PREPARING').notNull(),
	dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true }),
	recipientName: varchar("recipient_name", { length: 160 }),
	trackingCode: varchar("tracking_code", { length: 160 }),
	freightCost: numeric("freight_cost", { precision: 16, scale:  2 }).default('0').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("deliveries_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("deliveries_entity_status_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("deliveries_order_idx").using("btree", table.purchaseOrderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "deliveries_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrdersTable.id],
			name: "deliveries_purchase_order_id_purchase_orders_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "deliveries_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "deliveries_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const deliveryItemsTable = pgTable("delivery_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	deliveryId: uuid("delivery_id").notNull(),
	purchaseOrderItemId: uuid("purchase_order_item_id").notNull(),
	deliveredQuantity: numeric("delivered_quantity", { precision: 14, scale:  3 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("delivery_items_delivery_idx").using("btree", table.deliveryId.asc().nullsLast().op("uuid_ops")),
	index("delivery_items_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("delivery_items_item_uq").using("btree", table.deliveryId.asc().nullsLast().op("uuid_ops"), table.purchaseOrderItemId.asc().nullsLast().op("uuid_ops")),
	index("delivery_items_order_item_idx").using("btree", table.purchaseOrderItemId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "delivery_items_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.deliveryId],
			foreignColumns: [deliveriesTable.id],
			name: "delivery_items_delivery_id_deliveries_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderItemId],
			foreignColumns: [purchaseOrderItemsTable.id],
			name: "delivery_items_purchase_order_item_id_purchase_order_items_id_f"
		}).onDelete("restrict"),
]);

export const acquisitionItemsTable = pgTable("acquisition_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	acquisitionId: uuid("acquisition_id").notNull(),
	purchaseOrderItemId: uuid("purchase_order_item_id").notNull(),
	acquiredQuantity: numeric("acquired_quantity", { precision: 14, scale:  3 }).notNull(),
	costUnitPrice: numeric("cost_unit_price", { precision: 16, scale:  6 }).notNull(),
	lineDiscount: numeric("line_discount", { precision: 16, scale:  2 }).default('0').notNull(),
	totalCost: numeric("total_cost", { precision: 16, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("acquisition_items_acquisition_idx").using("btree", table.acquisitionId.asc().nullsLast().op("uuid_ops")),
	index("acquisition_items_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("acquisition_items_order_item_idx").using("btree", table.purchaseOrderItemId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("acquisition_items_order_item_uq").using("btree", table.acquisitionId.asc().nullsLast().op("uuid_ops"), table.purchaseOrderItemId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "acquisition_items_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.acquisitionId],
			foreignColumns: [acquisitionsTable.id],
			name: "acquisition_items_acquisition_id_acquisitions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderItemId],
			foreignColumns: [purchaseOrderItemsTable.id],
			name: "acquisition_items_purchase_order_item_id_purchase_order_items_i"
		}).onDelete("restrict"),
]);

export const purchaseOrdersTable = pgTable("purchase_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	orderNumber: varchar("order_number", { length: 80 }).notNull(),
	externalNumber: varchar("external_number", { length: 80 }),
	quoteNumber: varchar("quote_number", { length: 80 }),
	requisitionNumber: varchar("requisition_number", { length: 80 }),
	issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
	requestedDeliveryAt: timestamp("requested_delivery_at", { withTimezone: true }),
	officialTotal: numeric("official_total", { precision: 16, scale:  2 }).notNull(),
	paymentTerms: text("payment_terms"),
	instructions: text(),
	notes: text(),
	billingAddress: text("billing_address"),
	deliveryAddress: text("delivery_address"),
	lifecycleStatus: purchaseOrderLifecycleStatus("lifecycle_status").default('DRAFT').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("purchase_orders_customer_idx").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("purchase_orders_delivery_idx").using("btree", table.entityId.asc().nullsLast().op("timestamptz_ops"), table.requestedDeliveryAt.asc().nullsLast().op("uuid_ops")),
	index("purchase_orders_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("purchase_orders_number_uq").using("btree", table.entityId.asc().nullsLast().op("text_ops"), table.customerId.asc().nullsLast().op("text_ops"), table.orderNumber.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "purchase_orders_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customersTable.id],
			name: "purchase_orders_customer_id_customers_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "purchase_orders_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "purchase_orders_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const invoicesTable = pgTable("invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	purchaseOrderId: uuid("purchase_order_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	invoiceNumber: varchar("invoice_number", { length: 120 }).notNull(),
	issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
	dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
	grossAmount: numeric("gross_amount", { precision: 16, scale:  2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 16, scale:  2 }).default('0').notNull(),
	otherDeductions: numeric("other_deductions", { precision: 16, scale:  2 }).default('0').notNull(),
	status: invoiceStatus().default('DRAFT').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("invoices_entity_due_idx").using("btree", table.entityId.asc().nullsLast().op("timestamptz_ops"), table.dueAt.asc().nullsLast().op("uuid_ops")),
	index("invoices_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("invoices_number_uq").using("btree", table.entityId.asc().nullsLast().op("uuid_ops"), table.invoiceNumber.asc().nullsLast().op("uuid_ops")),
	index("invoices_order_idx").using("btree", table.purchaseOrderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "invoices_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrdersTable.id],
			name: "invoices_purchase_order_id_purchase_orders_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "invoices_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "invoices_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const purchaseOrderItemsTable = pgTable("purchase_order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	purchaseOrderId: uuid("purchase_order_id").notNull(),
	lineNumber: integer("line_number").notNull(),
	description: text().notNull(),
	brand: varchar({ length: 120 }).notNull(),
	specification: text(),
	originalUnit: varchar("original_unit", { length: 40 }).notNull(),
	normalizedUnit: varchar("normalized_unit", { length: 40 }).notNull(),
	orderedQuantity: numeric("ordered_quantity", { precision: 14, scale:  3 }).notNull(),
	saleUnitPrice: numeric("sale_unit_price", { precision: 16, scale:  6 }).notNull(),
	officialTotal: numeric("official_total", { precision: 16, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	productId: uuid("product_id").notNull(),
}, (table) => [
	index("purchase_order_items_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("purchase_order_items_line_uq").using("btree", table.purchaseOrderId.asc().nullsLast().op("int4_ops"), table.lineNumber.asc().nullsLast().op("uuid_ops")),
	index("purchase_order_items_order_idx").using("btree", table.purchaseOrderId.asc().nullsLast().op("uuid_ops")),
	index("purchase_order_items_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "purchase_order_items_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrdersTable.id],
			name: "purchase_order_items_purchase_order_id_purchase_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [productsTable.id],
			name: "purchase_order_items_product_id_products_id_fk"
		}).onDelete("restrict"),
]);

export const invoiceItemsTable = pgTable("invoice_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	purchaseOrderItemId: uuid("purchase_order_item_id").notNull(),
	invoicedQuantity: numeric("invoiced_quantity", { precision: 14, scale:  3 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 16, scale:  6 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 16, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("invoice_items_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("invoice_items_invoice_idx").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("invoice_items_item_uq").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops"), table.purchaseOrderItemId.asc().nullsLast().op("uuid_ops")),
	index("invoice_items_order_item_idx").using("btree", table.purchaseOrderItemId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "invoice_items_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoicesTable.id],
			name: "invoice_items_invoice_id_invoices_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderItemId],
			foreignColumns: [purchaseOrderItemsTable.id],
			name: "invoice_items_purchase_order_item_id_purchase_order_items_id_fk"
		}).onDelete("restrict"),
]);

export const productsTable = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	name: varchar({ length: 240 }).notNull(),
	brand: varchar({ length: 120 }).default('Outros').notNull(),
	specification: text(),
	packaging: varchar({ length: 40 }).notNull(),
	normalizedUnit: varchar("normalized_unit", { length: 40 }).default('UNIT').notNull(),
	lastPurchasePrice: numeric("last_purchase_price", { precision: 16, scale:  6 }),
	lastPurchaseSource: varchar("last_purchase_source", { length: 160 }),
	lastPurchasedAt: timestamp("last_purchased_at", { withTimezone: true }),
	lastSalePrice: numeric("last_sale_price", { precision: 16, scale:  6 }),
	lastSoldAt: timestamp("last_sold_at", { withTimezone: true }),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("products_entity_active_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops"), table.active.asc().nullsLast().op("bool_ops")),
	index("products_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("products_identity_uq").using("btree", table.entityId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops"), table.brand.asc().nullsLast().op("text_ops"), table.packaging.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "products_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "products_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "products_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export type CustomerRow = typeof customersTable.$inferSelect;
export type NewCustomerRow = typeof customersTable.$inferInsert;
export type ProductRow = typeof productsTable.$inferSelect;
export type NewProductRow = typeof productsTable.$inferInsert;
export type PurchaseOrderRow = typeof purchaseOrdersTable.$inferSelect;
export type NewPurchaseOrderRow = typeof purchaseOrdersTable.$inferInsert;
export type PurchaseOrderItemRow = typeof purchaseOrderItemsTable.$inferSelect;
export type NewPurchaseOrderItemRow = typeof purchaseOrderItemsTable.$inferInsert;
export type AcquisitionRow = typeof acquisitionsTable.$inferSelect;
export type NewAcquisitionRow = typeof acquisitionsTable.$inferInsert;
export type AcquisitionItemRow = typeof acquisitionItemsTable.$inferSelect;
export type NewAcquisitionItemRow = typeof acquisitionItemsTable.$inferInsert;
export type AcquisitionReceiptRow = typeof acquisitionReceiptsTable.$inferSelect;
export type NewAcquisitionReceiptRow = typeof acquisitionReceiptsTable.$inferInsert;
export type AcquisitionReceiptItemRow = typeof acquisitionReceiptItemsTable.$inferSelect;
export type NewAcquisitionReceiptItemRow = typeof acquisitionReceiptItemsTable.$inferInsert;
export type DeliveryRow = typeof deliveriesTable.$inferSelect;
export type NewDeliveryRow = typeof deliveriesTable.$inferInsert;
export type DeliveryItemRow = typeof deliveryItemsTable.$inferSelect;
export type NewDeliveryItemRow = typeof deliveryItemsTable.$inferInsert;
export type InvoiceRow = typeof invoicesTable.$inferSelect;
export type NewInvoiceRow = typeof invoicesTable.$inferInsert;
export type InvoiceItemRow = typeof invoiceItemsTable.$inferSelect;
export type NewInvoiceItemRow = typeof invoiceItemsTable.$inferInsert;
export type ReceivablePaymentRow = typeof receivablePaymentsTable.$inferSelect;
export type NewReceivablePaymentRow = typeof receivablePaymentsTable.$inferInsert;
