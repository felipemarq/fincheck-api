import { Account } from "@application/entities/Account";
import { DatabaseService } from "..";
import { accountsTable, categoriesTable } from "../schema";
import { AccountItem } from "../items/AccountItem";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, eq } from "drizzle-orm";

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
}
