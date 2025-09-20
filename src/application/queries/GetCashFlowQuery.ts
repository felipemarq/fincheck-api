import { Account } from "@application/entities/Account";
import { DatabaseService } from "@infra/database/neon";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { transactionsTable } from "@infra/database/neon/schema";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

@Injectable()
export class GetCashFlowQuery {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly databaseService: DatabaseService
  ) {}

  async execute({
    entityId,
    userId,
    basis,
    from,
    to,
  }: GetBalancesQuery.Input): Promise<GetBalancesQuery.Output> {
    const where = [
      eq(transactionsTable.entityId, entityId),
      eq(transactionsTable.userId, userId),
      gte(transactionsTable.date, from),
      lte(transactionsTable.date, to),
    ] as any[];

    if (basis === "cash") {
      where.push(eq(transactionsTable.isPaid, true));
    }

    const dayCol = sql<string>`to_char(date_trunc('day', ${transactionsTable.date}), 'YYYY-MM-DD')`;

    const rows = await this.databaseService.db
      .select({
        day: dayCol,
        income: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME'  THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
        expense: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
      })
      .from(transactionsTable)
      .where(and(...where))
      .groupBy(dayCol)
      .orderBy(asc(dayCol as any));

    // acumula saldo diário
    let cum = 0;
    const series = rows.map((r) => {
      const income = Number(r.income);
      const expense = Number(r.expense);
      const net = +(income - expense).toFixed(2);
      cum = +(cum + net).toFixed(2);
      return {
        date: r.day,
        income: +income.toFixed(2),
        expense: +expense.toFixed(2),
        net,
        cum,
      };
    });

    const totals = series.reduce(
      (acc, d) => {
        acc.income += d.income;
        acc.expense += d.expense;
        acc.net += d.net;
        return acc;
      },
      { income: 0, expense: 0, net: 0 }
    );
    totals.income = +totals.income.toFixed(2);
    totals.expense = +totals.expense.toFixed(2);
    totals.net = +totals.net.toFixed(2);

    return { series, totals };
  }
}

export namespace GetBalancesQuery {
  export type Input = {
    entityId: string;
    userId: string;
    from: Date;
    to: Date;
    basis: "competence" | "cash";
  };
  export type Output = Promise<{
    series: {
      date: string;
      income: number;
      expense: number;
      net: number;
      cum: number;
    }[];
    totals: {
      income: number;
      expense: number;
      net: number;
    };
  }>;
}
