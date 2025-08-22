// items/TransactionItem.ts
import { Account } from "@application/entities/Account";
import type { TransactionRow, NewTransactionRow } from "../schema";
import { Transaction } from "@application/entities/Transaction";

/**
 * Mapper entre a entidade de domínio (Account) e as linhas do banco (NUMERIC como string).
 * - fromRow  => DB -> Entidade
 * - toRow    => Entidade -> DB (insert/update)
 */
export class TransactionItem {
  // Construtor opcional (se quiser instanciar). Para mapper estático nem precisa.
  constructor(private readonly row: TransactionRow) {}

  /** DB -> Entidade de domínio (converte numeric-string -> number) */
  static fromRow(row: TransactionRow): Transaction {
    return new Transaction({
      id: row.id,
      accountId: row.accountId,
      categoryId: row.categoryId,
      entityId: row.entityId,
      userId: row.userId,
      name: row.name,
      date: row.date,
      dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
      type: row.type as Transaction.Type, // enum compatível
      isPaid: row.isPaid,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      value: Number(row.value),
      contactId: row.contactId ?? undefined,
      creditCardId: row.creditCardId ?? undefined,
      installmentPurchaseId: row.installmentPurchaseId ?? undefined,
    });
  }

  /**
   * Entidade -> Row p/ INSERT/UPDATE (converte number -> string "0.00")
   * Use o tipo inferido do Drizzle para garantir que o shape bate com a tabela.
   */
  static toRow(transaction: Transaction): NewTransactionRow {
    return {
      ...transaction,
      value: transaction.value.toFixed(2), // 👈 string "123.45"
    };
  }
}
