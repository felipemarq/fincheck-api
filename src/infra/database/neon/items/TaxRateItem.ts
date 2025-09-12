// src/infra/database/neon/items/TaxRateItem.ts
import { TaxRate } from "@application/entities/TaxRate";
import { TaxRateRow, NewTaxRateRow } from "../schema";
// ^ Garanta estes tipos no schema:
//   export type TaxRateRow = typeof taxRates.$inferSelect;
//   export type NewTaxRateRow = typeof taxRates.$inferInsert;

export class TaxRateItem {
  /** Row (DB) -> Entity */
  static fromRow(row: TaxRateRow): TaxRate {
    return new TaxRate({
      id: row.id,
      entityId: row.entityId,
      userId: row.userId,
      year: row.year,
      month: row.month,
      ratePercent: Number(row.ratePercent),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /** Entity -> Row de insert/update (NUMERIC como string) */
  static toRow(entity: TaxRate): NewTaxRateRow {
    return {
      id: entity.id,
      entityId: entity.entityId,
      userId: entity.userId,
      year: entity.year,
      month: entity.month,
      ratePercent: entity.ratePercent.toFixed(2), // <- NUMERIC (string)
      // createdAt/updatedAt são do DB (.defaultNow / .onUpdate)
    };
  }
}
