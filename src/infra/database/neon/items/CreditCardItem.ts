import { CreditCard } from "@application/entities/CreditCard";
import { CreditCardRow, NewCreditCardRow } from "../schema";

/**
 * Mapper entre a entidade de domínio e a linha do banco
 */
export class CreditCardItem {
  /** DB -> Entidade (converte numeric-string -> number) */
  static fromRow(row: CreditCardRow): CreditCard {
    return new CreditCard({
      id: row.id,
      entityId: row.entityId,
      userId: row.userId,
      accountId: row.accountId ?? undefined,
      name: row.name,
      color: row.color ?? "#868E96",
      creditLimit: Number(row.creditLimit),
      closingDay: row.closingDay,
      dueDay: row.dueDay,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    });
  }

  /** Entidade -> Row para insert/update (converte number -> string "0.00") */
  static toRow(card: CreditCard): NewCreditCardRow {
    return {
      id: card.id,
      entityId: card.entityId,
      userId: card.userId,
      accountId: card.accountId ?? null,
      name: card.name,
      color: card.color ?? "#868E96",
      creditLimit: (card.creditLimit ?? 0).toFixed(2),
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }
}
