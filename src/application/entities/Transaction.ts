export class Transaction {
  readonly id?: string;
  readonly entityId: string;
  readonly userId: string;
  readonly accountId: string;
  readonly categoryId: string;
  readonly creditCardId?: string;
  readonly installmentPurchaseId?: string;
  readonly contactId?: string;
  readonly name: string;
  readonly date: Date;
  readonly dueDate?: Date;
  readonly type: Transaction.Type;
  readonly isPaid: boolean;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly value: number;

  constructor(attr: Transaction.Attributes) {
    this.id = attr.id;
    this.entityId = attr.entityId;
    this.userId = attr.userId;
    this.accountId = attr.accountId;
    this.categoryId = attr.categoryId;
    this.creditCardId = attr.creditCardId;
    this.installmentPurchaseId = attr.installmentPurchaseId;
    this.contactId = attr.contactId;
    this.name = attr.name;
    this.date = attr.date;
    this.dueDate = attr.dueDate;
    this.type = attr.type;
    this.isPaid = attr.isPaid;
    this.notes = attr.notes;
    this.value = attr.value;
  }
}

export namespace Transaction {
  export type Attributes = {
    id?: string;
    entityId: string;
    userId: string;
    accountId: string;
    categoryId: string;
    creditCardId?: string;
    installmentPurchaseId?: string;
    contactId?: string;
    name: string;
    date: Date;
    dueDate?: Date;
    type: Transaction.Type;
    isPaid: boolean;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
    value: number;
  };

  export enum Type {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE",
  }
}

/*   {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    creditCardId: uuid("credit_card_id").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    installmentPurchaseId: uuid("installment_purchase_id").references(
      () => installmentPurchasesTable.id,
      { onDelete: "set null" }
    ),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),

    name: varchar("name", { length: 160 }).notNull(),
    value: money("value").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }), // útil para AP/AR
    type: transactionType("type").notNull(),
    isPaid: boolean("is_paid").notNull().default(true), // padrão: pago no ato
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }, */
