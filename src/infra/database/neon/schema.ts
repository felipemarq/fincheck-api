import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  numeric,
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  index,
  uniqueIndex,
  boolean,
  integer,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";

// ---------------------
// Enums (tipos do domínio)
// ---------------------

// schema.ts
export type AccountRow = typeof accountsTable.$inferSelect; // row lida do DB
export type NewAccountRow = typeof accountsTable.$inferInsert; // shape p/ insert

export type TransactionRow = typeof transactionsTable.$inferSelect; // row lida do DB
export type NewTransactionRow = typeof transactionsTable.$inferInsert; // shape p/ insert

export type RecurringTransactionRow =
  typeof recurringTransactionsTable.$inferSelect; // row lida do DB
export type NewRecurringTransactionRow =
  typeof recurringTransactionsTable.$inferInsert; // shape p/ insert

export type CreditCardRow = InferSelectModel<typeof creditCardsTable>;
export type NewCreditCardRow = InferInsertModel<typeof creditCardsTable>;

export const accountType = pgEnum("bank_account_type", [
  "CHECKING", // Conta corrente
  "INVESTMENT", // Conta de investimento
  "CASH", // Dinheiro em espécie/caixa
]);

export const transactionType = pgEnum("transaction_type", [
  "INCOME", // Receita
  "EXPENSE", // Despesa
]);

export const recurrenceType = pgEnum("recurrence_type", [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

export const entityType = pgEnum("entity_type", [
  "PF", // Pessoa Física
  "PJ", // Pessoa Jurídica
]);

// Helper: tipo dinheiro como string (NUMERIC) com precisão padrão.
export const money = (name: string) =>
  numeric(name, { precision: 14, scale: 2 });

// ---------------------
// Usuário e Entidade (PF/PJ)
// ---------------------
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  externalId: varchar({ length: 255 }),
});

export const entitiesTable = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 120 }).notNull().notNull(),
    type: entityType("type").notNull().default("PF"),
    color: varchar({ length: 7 }).notNull().default("#228be6"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    ownerIdx: index("entities_owner_idx").on(table.ownerUserId),
  })
);

export const entitiesRelations = relations(entitiesTable, ({ one, many }) => ({
  owner: one(usersTable, {
    fields: [entitiesTable.ownerUserId],
    references: [usersTable.id],
  }),
  accounts: many(accountsTable),
  categories: many(categoriesTable),
  transactions: many(transactionsTable),
  recurringTransactions: many(recurringTransactionsTable),
  installmentPurchases: many(installmentPurchasesTable),
  installments: many(installmentsTable),
  creditCards: many(creditCardsTable),
  contacts: many(contactsTable),
}));

// ---------------------
// Contas (antes: bank_accounts)
// ---------------------
export const accountsTable = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    // Usuário que criou/alterou (para auditoria simples)
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    initialBalance: money("initial_balance").notNull().default("0"),
    type: accountType("type").notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#868E96"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    accEntityIdx: index("accounts_entity_idx").on(table.entityId),
    accUserIdx: index("accounts_user_idx").on(table.userId),
  })
);

export const accountsRelations = relations(accountsTable, ({ one, many }) => ({
  entity: one(entitiesTable, {
    fields: [accountsTable.entityId],
    references: [entitiesTable.id],
  }),
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
  transactions: many(transactionsTable),
  recurringTransactions: many(recurringTransactionsTable),
  installmentPurchases: many(installmentPurchasesTable),
  creditCards: many(creditCardsTable),
}));

// ---------------------
// Categorias (INCOME/EXPENSE)
// ---------------------
export const categoriesTable = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    icon: varchar("icon", { length: 64 }).notNull(),
    type: transactionType("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    catEntityIdx: index("categories_entity_idx").on(table.entityId),
    catUniquePerEntity: uniqueIndex("categories_entity_name_type_uq").on(
      table.entityId,
      table.name,
      table.type
    ),
  })
);

export const categoriesRelations = relations(
  categoriesTable,
  ({ one, many }) => ({
    entity: one(entitiesTable, {
      fields: [categoriesTable.entityId],
      references: [entitiesTable.id],
    }),
    user: one(usersTable, {
      fields: [categoriesTable.userId],
      references: [usersTable.id],
    }),
    transactions: many(transactionsTable),
    recurringTransactions: many(recurringTransactionsTable),
    installmentPurchases: many(installmentPurchasesTable),
  })
);

// ---------------------
// Contatos (pagadores/fornecedores)
// ---------------------
export const contactsTable = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }),
    phone: varchar("phone", { length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    contactEntityIdx: index("contacts_entity_idx").on(table.entityId),
  })
);

export const contactsRelations = relations(contactsTable, ({ one, many }) => ({
  entity: one(entitiesTable, {
    fields: [contactsTable.entityId],
    references: [entitiesTable.id],
  }),
  user: one(usersTable, {
    fields: [contactsTable.userId],
    references: [usersTable.id],
  }),
  transactions: many(transactionsTable),
}));

// ---------------------
// Cartões de Crédito
// ---------------------
export const creditCardsTable = pgTable(
  "credit_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accountsTable.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 120 }).notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#868E96"),
    creditLimit: money("credit_limit").notNull().default("0"),
    // Dica: não materialize availableLimit; calcule sob demanda ou por fatura.
    closingDay: integer("closing_day").notNull(), // dia de fechamento (1-28)
    dueDay: integer("due_day").notNull(), // dia de vencimento (1-28)
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    ccEntityIdx: index("credit_cards_entity_idx").on(table.entityId),
    ccAccIdx: index("credit_cards_account_idx").on(table.accountId),
  })
);

export const creditCardsRelations = relations(
  creditCardsTable,
  ({ one, many }) => ({
    entity: one(entitiesTable, {
      fields: [creditCardsTable.entityId],
      references: [entitiesTable.id],
    }),
    user: one(usersTable, {
      fields: [creditCardsTable.userId],
      references: [usersTable.id],
    }),
    account: one(accountsTable, {
      fields: [creditCardsTable.accountId],
      references: [accountsTable.id],
    }),
    transactions: many(transactionsTable),
    installmentPurchases: many(installmentPurchasesTable),
  })
);

// ---------------------
// Compras Parceladas (cabeçalho)
// ---------------------
export const installmentPurchasesTable = pgTable(
  "installment_purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accountsTable.id, {
      onDelete: "cascade",
    }),
    categoryId: uuid("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    creditCardId: uuid("credit_card_id").references(() => creditCardsTable.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 160 }).notNull(),
    totalValue: money("total_value").notNull(),
    numberOfInstallments: integer("number_of_installments").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    type: transactionType("type").notNull().default("EXPENSE"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    ipEntityIdx: index("installment_purchases_entity_idx").on(table.entityId),
    ipCardIdx: index("installment_purchases_card_idx").on(table.creditCardId),
  })
);

export const installmentPurchasesRelations = relations(
  installmentPurchasesTable,
  ({ one, many }) => ({
    entity: one(entitiesTable, {
      fields: [installmentPurchasesTable.entityId],
      references: [entitiesTable.id],
    }),
    user: one(usersTable, {
      fields: [installmentPurchasesTable.userId],
      references: [usersTable.id],
    }),
    account: one(accountsTable, {
      fields: [installmentPurchasesTable.accountId],
      references: [accountsTable.id],
    }),
    category: one(categoriesTable, {
      fields: [installmentPurchasesTable.categoryId],
      references: [categoriesTable.id],
    }),
    creditCard: one(creditCardsTable, {
      fields: [installmentPurchasesTable.creditCardId],
      references: [creditCardsTable.id],
    }),
    installments: many(installmentsTable),
    transactions: many(transactionsTable),
  })
);

// ---------------------
// Parcelas (cada parcela referencia 1 transação)
// ---------------------
export const installmentsTable = pgTable(
  "installments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    installmentPurchaseId: uuid("installment_purchase_id")
      .notNull()
      .references(() => installmentPurchasesTable.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id")
      .unique()
      .references(() => transactionsTable.id, { onDelete: "cascade" }),
    value: money("value").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    paid: boolean("paid").notNull().default(false),
    paymentDate: timestamp("payment_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    instEntityIdx: index("installments_entity_idx").on(table.entityId),
    instDueIdx: index("installments_due_idx").on(table.dueDate),
  })
);

export const installmentsRelations = relations(
  installmentsTable,
  ({ one }) => ({
    entity: one(entitiesTable, {
      fields: [installmentsTable.entityId],
      references: [entitiesTable.id],
    }),
    purchase: one(installmentPurchasesTable, {
      fields: [installmentsTable.installmentPurchaseId],
      references: [installmentPurchasesTable.id],
    }),
    transaction: one(transactionsTable, {
      fields: [installmentsTable.transactionId],
      references: [transactionsTable.id],
    }),
  })
);

// ---------------------
// Recorrências (geram transações futuras)
// ---------------------
export const recurringTransactionsTable = pgTable(
  "recurring_transactions",
  {
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
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoriesTable.id, {
        onDelete: "cascade",
      }),
    creditCardId: uuid("credit_card_id").references(() => creditCardsTable.id, {
      onDelete: "set null",
    }),
    contactId: uuid("contact_id").references(() => contactsTable.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 160 }).notNull(),
    value: money("value").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    recurrence: recurrenceType("recurrence").notNull(),
    type: transactionType("type").notNull(),
    notes: text("notes"),
    // Opcional: série para idempotência (ex.: UUID fixo para a recorrência)
    seriesKey: varchar("series_key", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    recEntityIdx: index("recurring_transactions_entity_idx").on(table.entityId),
    recSeriesIdx: index("recurring_transactions_series_idx").on(
      table.seriesKey
    ),
  })
);

export const recurringTransactionsRelations = relations(
  recurringTransactionsTable,
  ({ one }) => ({
    entity: one(entitiesTable, {
      fields: [recurringTransactionsTable.entityId],
      references: [entitiesTable.id],
    }),
    user: one(usersTable, {
      fields: [recurringTransactionsTable.userId],
      references: [usersTable.id],
    }),
    account: one(accountsTable, {
      fields: [recurringTransactionsTable.accountId],
      references: [accountsTable.id],
    }),
    category: one(categoriesTable, {
      fields: [recurringTransactionsTable.categoryId],
      references: [categoriesTable.id],
    }),
    creditCard: one(creditCardsTable, {
      fields: [recurringTransactionsTable.creditCardId],
      references: [creditCardsTable.id],
    }),
  })
);

// ---------------------
// Transações (pontuais ou geradas por recorrência/parcelas)
// ---------------------
export const transactionsTable = pgTable(
  "transactions",
  {
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
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoriesTable.id, {
        onDelete: "set null",
      }),
    creditCardId: uuid("credit_card_id").references(() => creditCardsTable.id, {
      onDelete: "set null",
    }),
    installmentPurchaseId: uuid("installment_purchase_id").references(
      () => installmentPurchasesTable.id,
      { onDelete: "set null" }
    ),
    contactId: uuid("contact_id").references(() => contactsTable.id, {
      onDelete: "set null",
    }),

    name: varchar("name", { length: 160 }).notNull(),
    value: money("value").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }), // útil para AP/AR
    type: transactionType("type").notNull(),
    isPaid: boolean("is_paid").notNull().default(true), // padrão: pago no ato
    notes: text("notes"),

    // 👇 adiciona esta coluna
    seriesKey: varchar("series_key", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    trxEntityDateIdx: index("transactions_entity_date_idx").on(
      table.entityId,
      table.date
    ),
    trxCardDateIdx: index("transactions_card_date_idx").on(
      table.creditCardId,
      table.date
    ),
    trxTypeIdx: index("transactions_type_idx").on(table.type),
    trxSeriesUq: uniqueIndex("transactions_series_key_uq").on(table.seriesKey),
  })
);

export const transactionsRelations = relations(
  transactionsTable,
  ({ one }) => ({
    entity: one(entitiesTable, {
      fields: [transactionsTable.entityId],
      references: [entitiesTable.id],
    }),
    user: one(usersTable, {
      fields: [transactionsTable.userId],
      references: [usersTable.id],
    }),
    account: one(accountsTable, {
      fields: [transactionsTable.accountId],
      references: [accountsTable.id],
    }),
    category: one(categoriesTable, {
      fields: [transactionsTable.categoryId],
      references: [categoriesTable.id],
    }),
    creditCard: one(creditCardsTable, {
      fields: [transactionsTable.creditCardId],
      references: [creditCardsTable.id],
    }),
    installmentPurchase: one(installmentPurchasesTable, {
      fields: [transactionsTable.installmentPurchaseId],
      references: [installmentPurchasesTable.id],
    }),
    contact: one(contactsTable, {
      fields: [transactionsTable.contactId],
      references: [contactsTable.id],
    }),
  })
);

// ---------------------
// Impostos & Margem (config simples de alíquota por entidade e período)
// ---------------------
export const taxRates = pgTable(
  "tax_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // Período de competência da alíquota (mês/ano)
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1-12
    ratePercent: numeric("rate_percent", { precision: 5, scale: 2 }).notNull(), // ex.: 6.00
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    taxUniquePerMonth: uniqueIndex("tax_rates_entity_month_year_uq").on(
      table.entityId,
      table.year,
      table.month
    ),
  })
);

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  entity: one(entitiesTable, {
    fields: [taxRates.entityId],
    references: [entitiesTable.id],
  }),
  user: one(usersTable, {
    fields: [taxRates.userId],
    references: [usersTable.id],
  }),
}));

// ---------------------
// Idempotência (para POSTs que podem ser repetidos)
// ---------------------
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: varchar("key", { length: 128 }).notNull(),
    scope: varchar("scope", { length: 64 }).notNull(), // ex.: 'transactions.create'
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Opcional: salvar um hash/trecho da resposta para retornar sem reprocessar
    responseHash: varchar("response_hash", { length: 256 }),
  },
  (table) => ({
    pk: primaryKey({
      name: "idempotency_keys_pk",
      columns: [table.key, table.scope, table.entityId],
    }),
    idmpIdx: index("idempotency_keys_user_idx").on(table.userId),
  })
);

// ---------------------
// EXTRAS: Tabelas de auditoria (opcionais, exemplo)
// ---------------------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entitiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 64 }).notNull(), // ex.: 'TRANSACTION_CREATED'
    resource: varchar("resource", { length: 64 }).notNull(), // ex.: 'transactions'
    resourceId: uuid("resource_id").notNull(),
    at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
    metadata: text("metadata"), // JSON string com detalhes
  },
  (table) => ({
    auditEntityIdx: index("audit_logs_entity_idx").on(table.entityId),
  })
);

// ---------------------
// RELATIONS auxiliares (se desejar navegar via Drizzle)
// ---------------------
export const usersRelations = relations(usersTable, ({ many }) => ({
  entities: many(entitiesTable),
  accounts: many(accountsTable),
  categories: many(categoriesTable),
  creditCards: many(creditCardsTable),
  transactions: many(transactionsTable),
  recurringTransactions: many(recurringTransactionsTable),
  installmentPurchases: many(installmentPurchasesTable),
  contacts: many(contactsTable),
  taxRates: many(taxRates),
}));

// ---------------------
// CONSULTAS/TIPOS: exemplos práticos
// ---------------------
// 1) Cálculo de saldo de uma conta:
//    saldo = initial_balance + sum(receitas pagas) - sum(despesas pagas) + (ajustes fatura, se optar)
//    Exemplo de agregação (pseudo):
//    db.select({
//      inflow: sum(case when t.type='INCOME' and t.is_paid then t.value end),
//      outflow: sum(case when t.type='EXPENSE' and t.is_paid then t.value end),
//    }).from(transactions as t).where(eq(t.accountId, accountId))
//
// 2) Fatura do cartão (competência):
//    intervalo: (lastClosing, currentClosing]
//    selecionar transactions com creditCardId, date dentro do intervalo.
//
// 3) Parcelas:
//    cada `installments` tem `transaction_id` 1:1. Pagar parcela => marcar transaction.is_paid=true
//    e opcionalmente setar installments.paid=true, payment_date=now().
//
// 4) Recorrências:
//    usar `series_key` para idempotência por período (ex.: "rent-2025-08").
//
// 5) Margem de lucro (simples):
//    margem = receitas - (custos + impostos_estimados)
//    impostos_estimados = receitas * (taxRates.ratePercent/100) no mês/entidade.
//
// ---------------------
// Dica de conexão (Neon): use o driver Web/HTTP quando possível em Serverless
// para reduzir overhead de conexões. Ou reusar pool. Veja docs do Neon.
// ---------------------
