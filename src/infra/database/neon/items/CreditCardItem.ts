import { CreditCard } from "@application/entities/CreditCard";
import type { CreditCardRow, NewCreditCardRow } from "../schema";

export class CreditCardItem {
  static fromRow(row: CreditCardRow): CreditCard {
    return new CreditCard({
      id: row.id,
      entityId: row.entityId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      name: row.name,
      holderName: row.holderName,
      bank: row.bank,
      brand: row.brand as CreditCard.Brand,
      lastFour: row.lastFour,
      color: row.color,
      closingDay: row.closingDay,
      dueDay: row.dueDay,
      creditLimit: row.creditLimit === null ? undefined : Number(row.creditLimit),
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(card: CreditCard): NewCreditCardRow {
    return {
      id: card.id,
      entityId: card.entityId,
      createdByUserId: card.createdByUserId,
      updatedByUserId: card.updatedByUserId,
      name: card.name,
      holderName: card.holderName,
      bank: card.bank,
      brand: card.brand,
      lastFour: card.lastFour,
      color: card.color,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      creditLimit: card.creditLimit?.toFixed(2) ?? null,
      active: card.active,
    };
  }
}
