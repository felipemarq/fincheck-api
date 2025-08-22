import { and, eq } from "drizzle-orm";
import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "..";
import { transactionsTable } from "../schema";
import { Transaction } from "@application/entities/Transaction";
import { TransactionItem } from "../items/TransactionItem";

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
