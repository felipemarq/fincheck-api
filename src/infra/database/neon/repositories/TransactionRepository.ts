import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "..";
import { transactionsTable } from "../schema";
import { Transaction } from "@application/entities/Transaction";
import { TransactionItem } from "../items/TransactionItem";
import { ListTransactionQuery } from "@application/controllers/transactions/schemas/listTransactionQuerySchema";
import { types } from "util";

type UpdatePatch = {
  bankAccountId?: string; // trocar conta
  categoryId?: string | null; // null = limpar
  creditCardId?: string | null;
  installmentPurchaseId?: string | null;
  contactId?: string | null;
  name?: string;
  value?: number; // number no domínio
  date?: Date;
  dueDate?: Date | null;
  type?: "INCOME" | "EXPENSE";
  isPaid?: boolean;
  notes?: string | null;
};

@Injectable()
export class TransactionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /** Cria e retorna a entidade criada */
  async create(transaction: Transaction): Promise<Transaction> {
    const rowToInsert = TransactionItem.toRow(transaction);

    const [created] = await this.databaseService.db
      .insert(transactionsTable)
      .values(rowToInsert)
      .returning();

    return TransactionItem.fromRow(created);
  }

  async listAll({
    filters,
    userId,
  }: {
    filters: ListTransactionQuery;
    userId: string;
  }) {
    console.log({ filters });
    const whereClause = [
      eq(transactionsTable.entityId, filters.entityId),
      eq(transactionsTable.userId, userId),
    ];

    if (filters.accountId?.length) {
      whereClause.push(inArray(transactionsTable.accountId, filters.accountId));
    }

    if (filters.categoryId?.length) {
      whereClause.push(
        inArray(transactionsTable.categoryId, filters.categoryId)
      );
    }

    if (filters.type?.length) {
      whereClause.push(
        inArray(transactionsTable.type, filters.type as Transaction.Type[])
      );
    }

    if (typeof filters.isPaid === "boolean") {
      whereClause.push(eq(transactionsTable.isPaid, filters.isPaid));
    }

    if (filters.search && filters.search.trim()) {
      whereClause.push(
        ilike(transactionsTable.name, `%${filters.search.trim()}%`)
      );
    }

    if (filters.startDate)
      whereClause.push(gte(transactionsTable.date, filters.startDate));
    if (filters.endDate)
      whereClause.push(lte(transactionsTable.date, filters.endDate));
    if (filters.dueDateStart)
      whereClause.push(gte(transactionsTable.dueDate, filters.dueDateStart));
    if (filters.dueDateEnd)
      whereClause.push(lte(transactionsTable.dueDate, filters.dueDateEnd));

    // NUMERIC (string) -> compare/sort com CAST
    if (filters.minValue != null)
      whereClause.push(
        sql`${transactionsTable.value}::numeric >= ${Number(
          filters.minValue
        ).toFixed(2)}::numeric`
      );
    if (filters.maxValue != null)
      whereClause.push(
        sql`${transactionsTable.value}::numeric <= ${Number(
          filters.maxValue
        ).toFixed(2)}::numeric`
      );

    const whereExpr = and(...whereClause);

    // Ordenação primária + tie-breakers estáveis
    const orderCol =
      filters.sortBy === "value"
        ? sql`${transactionsTable.value}::numeric`
        : filters.sortBy === "name"
        ? transactionsTable.name
        : filters.sortBy === "createdAt"
        ? transactionsTable.createdAt
        : transactionsTable.date; // default "date"

    const orderMain =
      filters.sortDir === "asc" ? asc(orderCol as any) : desc(orderCol as any);
    const orderTiebreakers = [
      desc(transactionsTable.createdAt),
      desc(transactionsTable.id),
    ];

    //paginação
    const limit = Math.min(Math.max(Number(filters.pageSize!), 1), 100);
    const offset = (Math.max(Number(filters.page!), 1) - 1) * limit;

    // total (para paginação)
    const [{ total }] = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(transactionsTable)
      .where(whereExpr);

    // page
    const rows = await this.databaseService.db
      .select()
      .from(transactionsTable)
      .where(whereExpr)
      .orderBy(orderMain, ...orderTiebreakers)
      .limit(limit)
      .offset(offset);

    const items = rows.map(TransactionItem.fromRow);
    const hasNext = Number(filters.page!) * limit < total;

    return { items, total, page: filters.page, pageSize: limit, hasNext };
  }

  async update(
    transactionId: string,
    transaction: Transaction
  ): Promise<Transaction> {
    const row = TransactionItem.toRow(transaction);
    const rowToInsert = { ...row, updatedAt: new Date() };
    const [updated] = await this.databaseService.db
      .update(transactionsTable)
      .set(rowToInsert)
      .where(eq(transactionsTable.id, transactionId))
      .returning();
    return TransactionItem.fromRow(updated);
  }

  /** Exclui por id (escopado por entityId/userId). Lança erro se não encontrar. */
  async delete(params: {
    id: string;
    entityId: string;
    userId: string;
  }): Promise<void> {
    const { id, entityId, userId } = params;

    await this.databaseService.db
      .delete(transactionsTable)
      .where(
        and(
          eq(transactionsTable.id, id),
          eq(transactionsTable.entityId, entityId),
          eq(transactionsTable.userId, userId)
        )
      );
  }
}
