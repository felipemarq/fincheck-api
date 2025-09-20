import { Account } from "@application/entities/Account";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { TaxRateRepository } from "@infra/database/neon/repositories/TaxRateRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

// helpers de data
function startOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}
function endOfMonthUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
}

@Injectable()
export class GetMonthlyTaxQuery {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly taxRateRepository: TaxRateRepository
  ) {}

  async execute({
    entityId,
    userId,
    anyDateInMonth,
  }: GetMonthlyTaxQuery.Input): Promise<GetMonthlyTaxQuery.Output> {
    const y = anyDateInMonth.getUTCFullYear();
    const m = anyDateInMonth.getUTCMonth() + 1;

    const rate = await this.taxRateRepository.getMonthlyTax(
      entityId,
      userId,
      anyDateInMonth
    );

    const from = startOfMonthUTC(anyDateInMonth);
    const to = endOfMonthUTC(anyDateInMonth);

    const sumIncome = await this.transactionRepository.getSumIncome(
      entityId,
      userId,
      from,
      to
    );

    const income = Number(sumIncome);
    const estimatedTax = rate != null ? +(income * (rate / 100)).toFixed(2) : 0;

    return {
      month: `${y}-${String(m).padStart(2, "0")}`,
      income: +income.toFixed(2),
      ratePercent: rate,
      estimatedTax,
      missingRate: rate == null,
    };
  }
}

export namespace GetMonthlyTaxQuery {
  export type Input = {
    entityId: string;
    userId: string;
    anyDateInMonth: Date;
  };
  export type Output = Promise<{
    month: string;
    income: number;
    ratePercent: number | null;
    estimatedTax: number;
    missingRate: boolean;
  }>;
}
