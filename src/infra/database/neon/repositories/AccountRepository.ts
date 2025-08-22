import { Account } from "@application/entities/Account";
import { DatabaseService } from "..";
import { accountsTable } from "../schema";
import { AccountItem } from "../items/AccountItem";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, eq } from "drizzle-orm";

@Injectable()
export class AccountRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /** Cria e retorna a entidade criada */
  async create(account: Account): Promise<Account> {
    const rowToInsert = AccountItem.toRow(account);

    // Neon/Drizzle: .returning() retorna as colunas que você quiser (ou todas)
    const [created] = await this.databaseService.db
      .insert(accountsTable)
      .values(rowToInsert)
      .returning();

    // Mapeia de volta p/ entidade (string -> number)
    return AccountItem.fromRow(created);
  }

  async listAll({ entityId, userId }: { entityId: string; userId: string }) {
    const accounts = await this.databaseService.db
      .select()
      .from(accountsTable)
      .where(
        and(
          eq(accountsTable.entityId, entityId),
          eq(accountsTable.userId, userId)
        )
      );

    return accounts.map((account) => AccountItem.fromRow(account));
  }
}
