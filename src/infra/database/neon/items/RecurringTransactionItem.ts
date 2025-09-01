// items/TransactionItem.ts
import { RecurringTransaction } from "@application/entities/RecurringTransaction";
import type {
  RecurringTransactionRow,
  NewRecurringTransactionRow,
} from "../schema";
import { Transaction } from "@application/entities/Transaction";

/**
 * Mapper entre a entidade de domínio (Account) e as linhas do banco (NUMERIC como string).
 * - fromRow  => DB -> Entidade
 * - toRow    => Entidade -> DB (insert/update)
 */
export class RecurringTransactionItem {
  // Construtor opcional (se quiser instanciar). Para mapper estático nem precisa.
  constructor(private readonly row: RecurringTransactionRow) {}

  /** DB -> Entidade de domínio (converte numeric-string -> number) */
  static fromRow(row: RecurringTransactionRow): RecurringTransaction {
    return new RecurringTransaction({
      id: row.id,
      accountId: row.accountId,
      categoryId: row.categoryId,
      entityId: row.entityId,
      userId: row.userId,
      name: row.name,
      type: row.type as Transaction.Type, // enum compatível
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      value: Number(row.value),
      contactId: row.contactId ?? undefined,
      creditCardId: row.creditCardId ?? undefined,
      endDate: row.endDate ?? undefined,
      recurrence: row.recurrence as RecurringTransaction.Recurrence,
      seriesKey: row.seriesKey ?? undefined,
      startDate: row.startDate,
    });
  }

  /**
   * Entidade -> Row p/ INSERT/UPDATE (converte number -> string "0.00")
   * Use o tipo inferido do Drizzle para garantir que o shape bate com a tabela.
   */
  static toRow(
    recurringTransaction: RecurringTransaction
  ): NewRecurringTransactionRow {
    return {
      ...recurringTransaction,
      value: recurringTransaction.value.toFixed(2), // 👈 string "123.45"
    };
  }
}
