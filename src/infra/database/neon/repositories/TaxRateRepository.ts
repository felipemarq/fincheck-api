// src/infra/database/neon/repositories/TaxRateRepository.ts
import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "..";
import { taxRates } from "../schema";
import { TaxRate } from "@application/entities/TaxRate";
import { TaxRateItem } from "../items/TaxRateItem";
import { and, eq } from "drizzle-orm";

@Injectable()
export class TaxRateRepository {
  constructor(private readonly dbs: DatabaseService) {}

  /** Upsert por (entityId, year, month) */
  async upsert(rate: TaxRate): Promise<TaxRate> {
    const row = TaxRateItem.toRow(rate);

    const [saved] = await this.dbs.db
      .insert(taxRates)
      .values(row)
      .onConflictDoUpdate({
        target: [taxRates.entityId, taxRates.year, taxRates.month],
        set: { ratePercent: row.ratePercent, updatedAt: new Date() },
      })
      .returning();

    return TaxRateItem.fromRow(saved);
  }

  async get(
    entityId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<TaxRate | null> {
    const [r] = await this.dbs.db
      .select()
      .from(taxRates)
      .where(
        and(
          eq(taxRates.entityId, entityId),
          eq(taxRates.userId, userId),
          eq(taxRates.year, year),
          eq(taxRates.month, month)
        )
      );

    return r ? TaxRateItem.fromRow(r) : null;
  }

  async getRateValue(
    entityId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<number | null> {
    const r = await this.get(entityId, userId, year, month);
    return r ? r.ratePercent : null;
  }

  async getMonthlyTax(entityId: string, userId: string, anyDateInMonth: Date) {
    const y = anyDateInMonth.getUTCFullYear();
    const m = anyDateInMonth.getUTCMonth() + 1;

    // pega taxa (se existir)
    const [rateRow] = await this.dbs.db
      .select({ ratePercent: taxRates.ratePercent })
      .from(taxRates)
      .where(
        and(
          eq(taxRates.entityId, entityId),
          eq(taxRates.userId, userId),
          eq(taxRates.year, y),
          eq(taxRates.month, m)
        )
      )
      .limit(1);

    const rate = rateRow ? Number(rateRow.ratePercent) : null;
    return rate;
  }
}
