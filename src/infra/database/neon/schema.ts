import { pgTable, index, foreignKey, uuid, varchar, timestamp, text, numeric, integer, unique, uniqueIndex, boolean, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const acquisitionReceiptStatus = pgEnum("acquisition_receipt_status", ['CONFIRMED', 'CANCELLED'])

export const acquisitionStatus = pgEnum("acquisition_status", ['PLACED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'])

export const deliveryStatus = pgEnum("delivery_status", ['PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])

export const entityType = pgEnum("entity_type", ['PF', 'PJ'])

export const invoiceStatus = pgEnum("invoice_status", ['DRAFT', 'ISSUED', 'CANCELLED'])

export const purchaseOrderLifecycleStatus = pgEnum("purchase_order_lifecycle_status", ['DRAFT', 'ACTIVE', 'CANCELLED'])

export const quotationStatus = pgEnum("quotation_status", ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'])

export const payableStatus = pgEnum("payable_status", ['OPEN', 'PAID', 'CANCELLED'])

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

export const creditCardsTable = pgTable("credit_cards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	name: varchar({ length: 120 }).notNull(),
	holderName: varchar("holder_name", { length: 160 }).notNull(),
	bank: varchar({ length: 120 }).notNull(),
	brand: varchar({ length: 40 }).notNull(),
	lastFour: varchar("last_four", { length: 4 }).notNull(),
	color: varchar({ length: 7 }).default('#868e96').notNull(),
	closingDay: integer("closing_day").notNull(),
	dueDay: integer("due_day").notNull(),
	creditLimit: numeric("credit_limit", { precision: 16, scale:  2 }),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("credit_cards_entity_active_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops"), table.active.asc().nullsLast().op("bool_ops")),
	index("credit_cards_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("credit_cards_identity_uq").on(table.entityId, table.bank, table.lastFour),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "credit_cards_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "credit_cards_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "credit_cards_updated_by_user_id_users_id_fk"
		}).onDelete("restrict"),
]);

export const acquisitionsTable = pgTable("acquisitions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	purchaseOrderId: uuid("purchase_order_id"),
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
	creditCardId: uuid("credit_card_id"),
	installmentCount: integer("installment_count").default(1).notNull(),
	firstPaymentDueAt: timestamp("first_payment_due_at", { withTimezone: true }),
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
			columns: [table.creditCardId],
			foreignColumns: [creditCardsTable.id],
			name: "acquisitions_credit_card_id_credit_cards_id_fk"
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

export const payablesTable = pgTable("payables", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	acquisitionId: uuid("acquisition_id").notNull(),
	creditCardId: uuid("credit_card_id"),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	description: varchar({ length: 240 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 80 }).notNull(),
	installmentNumber: integer("installment_number").default(1).notNull(),
	installmentCount: integer("installment_count").default(1).notNull(),
	amount: numeric({ precision: 16, scale:  2 }).notNull(),
	dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
	status: payableStatus().default('OPEN').notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("payables_card_due_idx").using("btree", table.creditCardId.asc().nullsLast().op("uuid_ops"), table.dueAt.asc().nullsLast().op("timestamptz_ops")),
	index("payables_entity_due_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops"), table.dueAt.asc().nullsLast().op("timestamptz_ops")),
	index("payables_entity_status_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("enum_ops")),
	uniqueIndex("payables_acquisition_installment_uq").on(table.acquisitionId, table.installmentNumber),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "payables_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.acquisitionId],
			foreignColumns: [acquisitionsTable.id],
			name: "payables_acquisition_id_acquisitions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.creditCardId],
			foreignColumns: [creditCardsTable.id],
			name: "payables_credit_card_id_credit_cards_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [usersTable.id],
			name: "payables_created_by_user_id_users_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [usersTable.id],
			name: "payables_updated_by_user_id_users_id_fk"
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
	uniqueIndex("acquisition_receipt_items_item_uq").using("btree", table.receiptId.asc().nullsLast().op("uuid_ops"), table.acquisitionItemId.asc().nullsLast().op("uuid_ops"), table.purchaseOrderItemId.asc().nullsLast().op("uuid_ops")),
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
	productId: uuid("product_id").notNull(),
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
	index("acquisition_items_product_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
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
			columns: [table.productId],
			foreignColumns: [productsTable.id],
			name: "acquisition_items_product_id_products_id_fk"
		}).onDelete("restrict"),
]);

export const acquisitionItemAllocationsTable = pgTable("acquisition_item_allocations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	acquisitionItemId: uuid("acquisition_item_id").notNull(),
	purchaseOrderItemId: uuid("purchase_order_item_id").notNull(),
	allocatedQuantity: numeric("allocated_quantity", { precision: 14, scale:  3 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("acquisition_allocations_acquisition_item_idx").using("btree", table.acquisitionItemId.asc().nullsLast().op("uuid_ops")),
	index("acquisition_allocations_entity_idx").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("acquisition_allocations_order_item_idx").using("btree", table.purchaseOrderItemId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("acquisition_allocations_item_order_uq").on(table.acquisitionItemId, table.purchaseOrderItemId),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entitiesTable.id],
			name: "acquisition_item_allocations_entity_id_entities_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.acquisitionItemId],
			foreignColumns: [acquisitionItemsTable.id],
			name: "acquisition_item_allocations_acquisition_item_id_items_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.purchaseOrderItemId],
			foreignColumns: [purchaseOrderItemsTable.id],
			name: "acquisition_item_allocations_order_item_id_order_items_id_fk"
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
	code: varchar({ length: 80 }),
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
	uniqueIndex("products_entity_code_uq").on(table.entityId, table.code),
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

export const quotationsTable = pgTable("quotations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	updatedByUserId: uuid("updated_by_user_id").notNull(),
	number: varchar({ length: 80 }).notNull(),
	status: quotationStatus().default('DRAFT').notNull(),
	issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
	validUntil: timestamp("valid_until", { withTimezone: true }),
	sellerName: varchar("seller_name", { length: 160 }).notNull(),
	sellerDocument: varchar("seller_document", { length: 40 }),
	sellerEmail: varchar("seller_email", { length: 254 }),
	sellerPhone: varchar("seller_phone", { length: 40 }),
	sellerAddress: text("seller_address"),
	customerLegalName: varchar("customer_legal_name", { length: 160 }).notNull(),
	customerTradeName: varchar("customer_trade_name", { length: 160 }),
	customerDocument: varchar("customer_document", { length: 40 }).notNull(),
	customerEmail: varchar("customer_email", { length: 254 }),
	customerPhone: varchar("customer_phone", { length: 40 }),
	customerAddress: text("customer_address"),
	paymentTerms: text("payment_terms"),
	deliveryTerms: text("delivery_terms"),
	notes: text(),
	internalNotes: text("internal_notes"),
	subtotal: numeric({ precision: 16, scale: 2 }).notNull(),
	freight: numeric({ precision: 16, scale: 2 }).default('0').notNull(),
	discount: numeric({ precision: 16, scale: 2 }).default('0').notNull(),
	total: numeric({ precision: 16, scale: 2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("quotations_customer_idx").on(table.customerId),
	index("quotations_entity_issued_idx").on(table.entityId, table.issuedAt),
	index("quotations_entity_status_idx").on(table.entityId, table.status),
	uniqueIndex("quotations_entity_number_uq").on(table.entityId, table.number),
	foreignKey({
		columns: [table.entityId],
		foreignColumns: [entitiesTable.id],
		name: "quotations_entity_id_entities_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customersTable.id],
		name: "quotations_customer_id_customers_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.createdByUserId],
		foreignColumns: [usersTable.id],
		name: "quotations_created_by_user_id_users_id_fk"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.updatedByUserId],
		foreignColumns: [usersTable.id],
		name: "quotations_updated_by_user_id_users_id_fk"
	}).onDelete("restrict"),
]);

export const quotationItemsTable = pgTable("quotation_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	quotationId: uuid("quotation_id").notNull(),
	productId: uuid("product_id").notNull(),
	lineNumber: integer("line_number").notNull(),
	productCode: varchar("product_code", { length: 80 }),
	description: text().notNull(),
	brand: varchar({ length: 120 }).notNull(),
	specification: text(),
	unit: varchar({ length: 40 }).notNull(),
	quantity: numeric({ precision: 14, scale: 3 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 16, scale: 6 }).notNull(),
	total: numeric({ precision: 16, scale: 2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("quotation_items_entity_idx").on(table.entityId),
	uniqueIndex("quotation_items_line_uq").on(table.quotationId, table.lineNumber),
	index("quotation_items_product_idx").on(table.productId),
	index("quotation_items_quotation_idx").on(table.quotationId),
	foreignKey({
		columns: [table.entityId],
		foreignColumns: [entitiesTable.id],
		name: "quotation_items_entity_id_entities_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.quotationId],
		foreignColumns: [quotationsTable.id],
		name: "quotation_items_quotation_id_quotations_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.productId],
		foreignColumns: [productsTable.id],
		name: "quotation_items_product_id_products_id_fk"
	}).onDelete("restrict"),
]);

export const quotationItemImagesTable = pgTable("quotation_item_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityId: uuid("entity_id").notNull(),
	quotationId: uuid("quotation_id").notNull(),
	quotationItemId: uuid("quotation_item_id").notNull(),
	storageKey: varchar("storage_key", { length: 500 }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	contentType: varchar("content_type", { length: 80 }).notNull(),
	size: integer().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index("quotation_images_entity_idx").on(table.entityId),
	index("quotation_images_item_idx").on(table.quotationItemId),
	index("quotation_images_quotation_idx").on(table.quotationId),
	uniqueIndex("quotation_images_storage_key_uq").on(table.storageKey),
	foreignKey({
		columns: [table.entityId],
		foreignColumns: [entitiesTable.id],
		name: "quotation_images_entity_id_entities_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.quotationId],
		foreignColumns: [quotationsTable.id],
		name: "quotation_images_quotation_id_quotations_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.quotationItemId],
		foreignColumns: [quotationItemsTable.id],
		name: "quotation_images_item_id_quotation_items_id_fk"
	}).onDelete("cascade"),
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
export type AcquisitionItemAllocationRow = typeof acquisitionItemAllocationsTable.$inferSelect;
export type NewAcquisitionItemAllocationRow = typeof acquisitionItemAllocationsTable.$inferInsert;
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
export type CreditCardRow = typeof creditCardsTable.$inferSelect;
export type NewCreditCardRow = typeof creditCardsTable.$inferInsert;
export type PayableRow = typeof payablesTable.$inferSelect;
export type NewPayableRow = typeof payablesTable.$inferInsert;
export type QuotationRow = typeof quotationsTable.$inferSelect;
export type NewQuotationRow = typeof quotationsTable.$inferInsert;
export type QuotationItemRow = typeof quotationItemsTable.$inferSelect;
export type NewQuotationItemRow = typeof quotationItemsTable.$inferInsert;
export type QuotationItemImageRow = typeof quotationItemImagesTable.$inferSelect;
export type NewQuotationItemImageRow = typeof quotationItemImagesTable.$inferInsert;
