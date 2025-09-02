import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "..";
import { recurringTransactionsTable } from "../schema";
import { RecurringTransactionItem } from "../items/RecurringTransactionItem";
import { RecurringTransaction } from "@application/entities/RecurringTransaction";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { ListRecurringTransactionQuery } from "@application/controllers/recurringTransactions/schemas/listRecurringTransactionQuerySchema";
import { Transaction } from "@application/entities/Transaction";
import { TransactionItem } from "../items/TransactionItem";

@Injectable()
export class RecurringTransactionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /** Cria e retorna a entidade criada */
  async create(
    recurringTransaction: RecurringTransaction
  ): Promise<RecurringTransaction> {
    const rowToInsert = RecurringTransactionItem.toRow(recurringTransaction);

    const [created] = await this.databaseService.db
      .insert(recurringTransactionsTable)
      .values(rowToInsert)
      .returning();

    return RecurringTransactionItem.fromRow(created);
  }

  async listAll({
    filters,
    userId,
  }: {
    filters: ListRecurringTransactionQuery;
    userId: string;
  }) {
    console.log({ filters });
    const whereClause = [
      eq(recurringTransactionsTable.entityId, filters.entityId),
      eq(recurringTransactionsTable.userId, userId),
    ];

    if (filters.accountId?.length) {
      whereClause.push(
        inArray(recurringTransactionsTable.accountId, filters.accountId)
      );
    }

    if (filters.categoryId?.length) {
      whereClause.push(
        inArray(recurringTransactionsTable.categoryId, filters.categoryId)
      );
    }

    if (filters.type?.length) {
      whereClause.push(
        inArray(
          recurringTransactionsTable.type,
          filters.type as Transaction.Type[]
        )
      );
    }

    if (filters.search && filters.search.trim()) {
      whereClause.push(
        ilike(recurringTransactionsTable.name, `%${filters.search.trim()}%`)
      );
    }

    // NUMERIC (string) -> compare/sort com CAST
    if (filters.value != null)
      whereClause.push(
        sql`${recurringTransactionsTable.value}::numeric >= ${Number(
          filters.value
        ).toFixed(2)}::numeric`
      );

    const whereExpr = and(...whereClause);

    // Ordenação primária + tie-breakers estáveis
    const orderCol =
      filters.sortBy === "value"
        ? sql`${recurringTransactionsTable.value}::numeric`
        : filters.sortBy === "name"
        ? recurringTransactionsTable.name
        : recurringTransactionsTable.createdAt; // default "createdAt"
    const orderMain =
      filters.sortDir === "asc" ? asc(orderCol as any) : desc(orderCol as any);
    const orderTiebreakers = [
      desc(recurringTransactionsTable.createdAt),
      desc(recurringTransactionsTable.id),
    ];

    //paginação
    const limit = Math.min(Math.max(Number(filters.pageSize!), 1), 100);
    const offset = (Math.max(Number(filters.page!), 1) - 1) * limit;

    // total (para paginação)
    const [{ total }] = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(recurringTransactionsTable)
      .where(whereExpr);

    // page
    const rows = await this.databaseService.db
      .select()
      .from(recurringTransactionsTable)
      .where(whereExpr)
      .orderBy(orderMain, ...orderTiebreakers)
      .limit(limit)
      .offset(offset);

    const items = rows.map(RecurringTransactionItem.fromRow);
    const hasNext = Number(filters.page!) * limit < total;

    return { items, total, page: filters.page, pageSize: limit, hasNext };
  }

  async update(
    recurringTransactionId: string,
    recurringTransaction: RecurringTransaction
  ): Promise<RecurringTransaction> {
    const row = RecurringTransactionItem.toRow(recurringTransaction);
    const rowToInsert = { ...row, updatedAt: new Date() };
    const [updated] = await this.databaseService.db
      .update(recurringTransactionsTable)
      .set(rowToInsert)
      .where(eq(recurringTransactionsTable.id, recurringTransactionId))
      .returning();
    return RecurringTransactionItem.fromRow(updated);
  }

  async delete(params: {
    id: string;
    entityId: string;
    userId: string;
  }): Promise<void> {
    const { id, entityId, userId } = params;

    await this.databaseService.db
      .delete(recurringTransactionsTable)
      .where(
        and(
          eq(recurringTransactionsTable.id, id),
          eq(recurringTransactionsTable.entityId, entityId),
          eq(recurringTransactionsTable.userId, userId)
        )
      );
  }

  /**
   * Regras cuja janela [startDate..endDate] intersecta [from..to]
   * (startDate <= to) AND (endDate IS NULL OR endDate >= from)
   */
  async listIntersecting(
    from: Date,
    to: Date
  ): Promise<RecurringTransaction[]> {
    const rows = await this.databaseService.db
      .select()
      .from(recurringTransactionsTable)
      .where(
        and(
          lte(recurringTransactionsTable.startDate, to),
          or(
            isNull(recurringTransactionsTable.endDate),
            gte(recurringTransactionsTable.endDate, from)
          )
        )
      );

    return rows.map(RecurringTransactionItem.fromRow);
  }
}
