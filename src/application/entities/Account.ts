export class Account {
  readonly id?: string;
  readonly entityId: string;
  readonly userId: string;
  readonly name: string;
  readonly initialBalance: number;
  readonly type: Account.Type;
  readonly color?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attr: Account.Attributes) {
    this.id = attr.id;
    this.entityId = attr.entityId;
    this.userId = attr.userId;
    this.name = attr.name;
    this.initialBalance = attr.initialBalance;
    this.type = attr.type;
    this.color = attr.color ?? "#868E96";
    this.createdAt = attr.createdAt;
    this.updatedAt = attr.updatedAt;
  }
}

export namespace Account {
  export type Attributes = {
    id?: string;
    entityId: string;
    userId: string;
    name: string;
    initialBalance: number;
    type: Account.Type;
    color?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export enum Type {
    CHECKING = "CHECKING",
    INVESTMENT = "INVESTMENT",
    CASH = "CASH",
  }
}

/* export const accountsTable = pgTable(
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
      .notNull(),
  },
  (table) => ({
    accEntityIdx: index("accounts_entity_idx").on(table.entityId),
    accUserIdx: index("accounts_user_idx").on(table.userId),
  })
); */
