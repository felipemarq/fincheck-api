// src/application/useCases/taxes/GetMonthlyTaxEstimateUseCase.ts
import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "@infra/database/neon";
import { transactionsTable } from "@infra/database/neon/schema";
import { TaxRateRepository } from "@infra/database/neon/repositories/TaxRateRepository";
import { and, eq, gte, lte, sql } from "drizzle-orm";

function monthBoundsUTC(year: number, month1to12: number) {
  const start = new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month1to12, 0, 23, 59, 59, 999));
  return { start, end };
}

@Injectable()
export class GetMonthlyTaxEstimateUseCase {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly taxRateRepository: TaxRateRepository
  ) {}

  async execute(input: {
    entityId: string;
    userId: string;
    year: number;
    month: number;
  }) {
    const rate = await this.taxRateRepository.getRateValue(
      input.entityId,
      input.userId,
      input.year,
      input.month
    );
    // se não houver rate, decide política: retorno 0 e flag, ou erro 400.
    if (rate == null) {
      return {
        year: input.year,
        month: input.month,
        income: 0,
        ratePercent: null,
        estimatedTax: 0,
        missingRate: true,
      };
    }

    const { start, end } = monthBoundsUTC(input.year, input.month);

    // soma das receitas do mês (competência)
    // value é NUMERIC (string). Fazemos CAST para numeric no SUM.
    const [{ sumIncome }] = await this.dbs.db
      .select({
        sumIncome: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type} = 'INCOME'
                                THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.entityId, input.entityId),
          eq(transactionsTable.userId, input.userId),
          gte(transactionsTable.date, start),
          lte(transactionsTable.date, end)
        )
      );

    const estimated = +(sumIncome * (rate / 100)).toFixed(2);

    return {
      year: input.year,
      month: input.month,
      income: +(+sumIncome).toFixed(2),
      ratePercent: rate,
      estimatedTax: estimated,
      missingRate: false,
    };
  }
}
