// items/AccountItem.ts
import { Account } from "@application/entities/Account";
import type { AccountRow, NewAccountRow } from "../schema";

/**
 * Mapper entre a entidade de domínio (Account) e as linhas do banco (NUMERIC como string).
 * - fromRow  => DB -> Entidade
 * - toRow    => Entidade -> DB (insert/update)
 */
export class AccountItem {
  // Construtor opcional (se quiser instanciar). Para mapper estático nem precisa.
  constructor(private readonly row: AccountRow) {}

  /** DB -> Entidade de domínio (converte numeric-string -> number) */
  static fromRow(row: AccountRow): Account {
    return new Account({
      id: row.id,
      entityId: row.entityId,
      userId: row.userId,
      name: row.name,
      // Postgres NUMERIC chega como string, convertemos p/ number na entidade
      initialBalance: Number(row.initialBalance),
      type: row.type as Account.Type, // enum compatível
      color: row.color ?? "#868E96",
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    });
  }

  /**
   * Entidade -> Row p/ INSERT/UPDATE (converte number -> string "0.00")
   * Use o tipo inferido do Drizzle para garantir que o shape bate com a tabela.
   */
  static toRow(account: Account): NewAccountRow {
    return {
      id: account.id, // opcional no insert, se usar defaultRandom() pode omitir
      entityId: account.entityId,
      userId: account.userId,
      name: account.name,
      initialBalance: account.initialBalance.toFixed(2), // 👈 string "123.45"
      type: account.type,
      color: account.color ?? "#868E96",
      // createdAt/updatedAt: deixe o DB preencher (defaultNow)
    };
  }
}
