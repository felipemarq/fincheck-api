import { Account } from "@application/entities/Account";
import { DatabaseService } from "..";
import { accountsTable, categoriesTable, transactionsTable } from "../schema";
import { AccountItem } from "../items/AccountItem";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
}> = [
  // INCOME
  { name: "Salário", type: "INCOME", icon: "salary" },
  { name: "Vendas", type: "INCOME", icon: "sale" },
  { name: "Rendimentos", type: "INCOME", icon: "trending-up" },

  // EXPENSE
  { name: "Aluguel", type: "EXPENSE", icon: "home" },
  { name: "Alimentação", type: "EXPENSE", icon: "food" },
  { name: "Transporte", type: "EXPENSE", icon: "transport" },
  { name: "Saúde", type: "EXPENSE", icon: "health" },
  { name: "Educação", type: "EXPENSE", icon: "edication" },
  { name: "Lazer", type: "EXPENSE", icon: "fun" },
  { name: "Impostos", type: "EXPENSE", icon: "tax" },
];

@Injectable()
export class CategoryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async seedDefault({
    entityId,
    userId,
  }: {
    entityId: string;
    userId: string;
  }) {
    const values = DEFAULT_CATEGORIES.map((c) => ({
      entityId,
      userId,
      name: c.name,
      icon: c.icon,
      type: c.type, // 'INCOME' | 'EXPENSE'
    }));
    const insertedCategories = await this.databaseService.db
      .insert(categoriesTable)
      .values(values)
      .onConflictDoNothing({
        target: [
          categoriesTable.entityId,
          categoriesTable.name,
          categoriesTable.type,
        ],
      })
      .returning();

    return insertedCategories;
  }

  async getTopCategories(
    entityId: string,
    userId: string,
    from: Date,
    to: Date,
    topN: number
  ) {
    const rows = await this.databaseService.db
      .select({
        categoryId: transactionsTable.categoryId,
        name: categoriesTable.name,
        icon: categoriesTable.icon,
        amount: sql<number>`sum((${transactionsTable.value})::numeric)`,
      })
      .from(transactionsTable)
      .innerJoin(
        categoriesTable,
        and(
          eq(categoriesTable.id, transactionsTable.categoryId),
          eq(categoriesTable.entityId, entityId)
        )
      )
      .where(
        and(
          eq(transactionsTable.entityId, entityId),
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.type, "EXPENSE"),
          gte(transactionsTable.date, from),
          lte(transactionsTable.date, to)
        )
      )
      .groupBy(
        transactionsTable.categoryId,
        categoriesTable.name,
        categoriesTable.icon
      )
      .orderBy(desc(sql`sum((${transactionsTable.value})::numeric)`))
      .limit(topN);
    return rows;
  }
}
