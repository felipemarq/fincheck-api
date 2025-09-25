import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "..";
import { accountsTable, categoriesTable, transactionsTable } from "../schema";
import { Transaction } from "@application/entities/Transaction";
import { TransactionItem } from "../items/TransactionItem";
import { ListTransactionQuery } from "@application/controllers/transactions/schemas/listTransactionQuerySchema";
import { types } from "util";
import { TransactionListItem } from "@application/queries/types/TransactionListItem";
import { Account } from "@application/entities/Account";

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

  async findOne({
    transactionId,
    userId,
    entityId,
  }: {
    transactionId: string;
    userId: string;
    entityId: string;
  }) {
    const [r] = await this.databaseService.db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.id, transactionId),
          eq(transactionsTable.entityId, entityId),
          eq(transactionsTable.userId, userId)
        )
      );

    return r ? TransactionItem.fromRow(r) : null;
  }

  async listAll({
    filters,
    userId,
  }: {
    filters: ListTransactionQuery;
    userId: string;
  }) {
    // ---------- mesmo where da sua listAll ----------
    const whereClause = [
      eq(transactionsTable.entityId, filters.entityId),
      eq(transactionsTable.userId, userId),
    ] as any[];

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

    // ---------- ordenação/tie-breakers idênticos ----------
    const orderCol =
      filters.sortBy === "value"
        ? sql`${transactionsTable.value}::numeric`
        : filters.sortBy === "name"
        ? transactionsTable.name
        : filters.sortBy === "createdAt"
        ? transactionsTable.createdAt
        : transactionsTable.date;

    const orderMain =
      filters.sortDir === "asc" ? asc(orderCol as any) : desc(orderCol as any);
    const orderTiebreakers = [
      desc(transactionsTable.createdAt),
      desc(transactionsTable.id),
    ];

    // ---------- paginação ----------
    const limit = Math.min(Math.max(Number(filters.pageSize ?? "10"), 1), 100);
    const offset = (Math.max(Number(filters.page ?? "1"), 1) - 1) * limit;

    const [{ total }] = await this.databaseService.db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(transactionsTable)
      .where(whereExpr);

    // ---------- SELECT com aliases (t, acc, cat) ----------
    const rows = await this.databaseService.db
      .select({
        t: transactionsTable, // transação inteira (para usar o TransactionItem)
        acc: {
          id: accountsTable.id,
          name: accountsTable.name,
          color: accountsTable.color,
          type: accountsTable.type,
        },
        cat: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          icon: categoriesTable.icon,
          type: categoriesTable.type,
        },
      })
      .from(transactionsTable)
      .leftJoin(
        accountsTable,
        eq(accountsTable.id, transactionsTable.accountId)
      )
      .leftJoin(
        categoriesTable,
        eq(categoriesTable.id, transactionsTable.categoryId)
      )
      .where(whereExpr)
      .orderBy(orderMain, ...orderTiebreakers)
      .limit(limit)
      .offset(offset);

    // ---------- mapping (mantém seu TransactionItem) ----------
    const items: TransactionListItem[] = rows.map(({ t, acc, cat }) => {
      const tx = TransactionItem.fromRow(t); // aqui você mantém todas as conversões (numeric->number etc)

      return {
        ...tx,
        account: acc?.id
          ? {
              id: acc.id!,
              name: acc.name!,
              color: acc.color ?? "#868E96",
              type: acc.type! as Account.Type, // "CHECKING" | "INVESTMENT" | "CASH"
            }
          : null,
        category: cat?.id
          ? {
              id: cat.id!,
              name: cat.name!,
              icon: cat.icon!,
              type: cat.type! as Transaction.Type, // "INCOME" | "EXPENSE"
            }
          : null,
      };
    });

    const hasNext = Number(filters.page ?? "1") * limit < total;
    return { items, total, page: filters.page, pageSize: limit, hasNext };
  }

  async getPaidTransactions(userId: string, entityId: string) {
    const rows = await this.databaseService.db
      .select({
        accountId: transactionsTable.accountId,
        income: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=true THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
        expense: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=true THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.entityId, entityId),
          eq(transactionsTable.userId, userId)
        )
      )
      .groupBy(transactionsTable.accountId);

    return rows;
  }

  async getDueUpcoming(entityId: string, userId: string, to: Date) {
    const today = new Date();
    const rows = await this.databaseService.db
      .select({
        id: transactionsTable.id,
        name: transactionsTable.name,
        dueDate: transactionsTable.dueDate,
        value: transactionsTable.value,
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.entityId, entityId),
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.isPaid, false),
          gte(transactionsTable.dueDate, today),
          lte(transactionsTable.dueDate, to)
        )
      )
      .orderBy(asc(transactionsTable.dueDate))
      .limit(20);

    return rows;
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

  async getSumIncome(entityId: string, userId: string, from: Date, to: Date) {
    const [{ sumIncome }] = await this.databaseService.db
      .select({
        sumIncome: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME'
                                  THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.entityId, entityId),
          eq(transactionsTable.userId, userId),
          gte(transactionsTable.date, from),
          lte(transactionsTable.date, to)
        )
      );

    return sumIncome;
  }
}
