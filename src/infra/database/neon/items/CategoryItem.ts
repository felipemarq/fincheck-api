// src/infra/database/neon/items/CategoryItem.ts
import { Category } from "@application/entities/Category";
import { CategoryRow, NewCategoryRow } from "../schema";

/**
 * Mapper entre a entidade de domínio e a linha do banco (categories)
 */
export class CategoryItem {
  /** DB -> Entidade */
  static fromRow(row: CategoryRow): Category {
    return new Category({
      id: row.id,
      entityId: row.entityId,
      userId: row.userId,
      name: row.name,
      icon: row.icon,
      // transaction_type enum no DB ↔ Transaction.Type no domínio
      type: row.type as Category["type"],
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    });
  }

  /** Entidade -> Row para insert/update */
  static toRow(category: Category): NewCategoryRow {
    return {
      id: category.id,
      entityId: category.entityId,
      userId: category.userId,
      name: category.name,
      icon: category.icon,
      type: category.type, // o Drizzle aceita o enum literal ("INCOME" | "EXPENSE")
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
