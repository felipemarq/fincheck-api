import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "@infra/database/neon";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { CategoryRepository } from "@infra/database/neon/repositories/CategoryRepository";
import { TaxRateRepository } from "@infra/database/neon/repositories/TaxRateRepository";

// helpers de data
function startOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}
function endOfMonthUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
}
function subDaysUTC(d: Date, days: number) {
  return new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
}
function monthKeyUTC(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

@Injectable()
export class GetDashboardUseCase {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly accountsRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly taxRateRepository: TaxRateRepository
  ) {}

  async execute(input: {
    entityId: string;
    userId: string;
    range: "this-month" | "last-30d" | "custom";
    from?: Date;
    to?: Date;
    sections: string[];
    topN: number;
    basis: "competence" | "cash";
  }) {
    const now = new Date();

    let from = input.from;
    let to = input.to;

    if (input.range === "this-month") {
      from = startOfMonthUTC(now);
      to = endOfMonthUTC(now);
    } else if (input.range === "last-30d") {
      to = now;
      from = subDaysUTC(now, 29);
    }

    // fallback seguro
    if (!from || !to) {
      from = startOfMonthUTC(now);
      to = endOfMonthUTC(now);
    }

    const want = (s: string) =>
      input.sections.length === 0 || input.sections.includes(s);

    // ============== tasks em paralelo ============
    const tasks: Record<string, Promise<any>> = {};

    if (want("balances"))
      tasks.balances = this.getBalances(input.entityId, input.userId);
    if (want("cashflow"))
      tasks.cashflow = this.getCashflow(
        input.entityId,
        input.userId,
        from!,
        to!,
        input.basis
      );
    if (want("topCategories"))
      tasks.topCategories = this.getTopCategories(
        input.entityId,
        input.userId,
        from!,
        to!,
        input.topN
      );
    if (want("due"))
      tasks.due = this.getDueUpcoming(input.entityId, input.userId, to!);
    if (want("tax"))
      tasks.tax = this.getMonthlyTax(input.entityId, input.userId, from!);

    // =============================================

    console.log("tasks", tasks);

    const pairs = await Promise.all(
      Object.entries(tasks).map(async ([k, p]) => [k, await p] as const)
    );

    console.log("pairs", pairs);

    const body: any = {
      range: { from, to },
      generatedAt: new Date().toISOString(),
    };
    for (const [k, v] of pairs) body[k] = v;

    console.log("body", body);
    return body;
  }

  // --------- BALANCES ---------
  private async getBalances(entityId: string, userId: string) {
    // 1) todas as contas da entidade
    const accounts = await this.accountsRepository.listAll({
      entityId,
      userId,
    });

    // 2) agregados de receitas/despesas pagas por conta
    const rows = await this.transactionRepository.getPaidTransactions(
      userId,
      entityId
    );

    const byAcc = new Map<string, { income: number; expense: number }>();
    rows.forEach((r) =>
      byAcc.set(r.accountId, {
        income: Number(r.income),
        expense: Number(r.expense),
      })
    );

    return accounts.map((acc) => {
      const agg = byAcc.get(acc.id!) ?? { income: 0, expense: 0 };
      const ib = Number(acc.initialBalance); // NUMERIC string -> number
      const balance = +(ib + agg.income - agg.expense).toFixed(2);
      return {
        accountId: acc.id,
        name: acc.name,
        type: acc.type,
        color: acc.color,
        balance,
      };
    });
  }

  // --------- CASHFLOW DIÁRIO ---------
  private async getCashflow(
    entityId: string,
    userId: string,
    from: Date,
    to: Date,
    basis: "competence" | "cash"
  ) {
    const rows = await this.transactionRepository.getCashflow(
      entityId,
      userId,
      from,
      to,
      basis
    );

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

  // --------- TOP CATEGORIES (despesa) ---------
  private async getTopCategories(
    entityId: string,
    userId: string,
    from: Date,
    to: Date,
    topN: number
  ) {
    const rows = await this.categoryRepository.getTopCategories(
      entityId,
      userId,
      from,
      to,
      topN
    );

    return rows.map((r) => ({
      categoryId: r.categoryId!,
      name: r.name,
      icon: r.icon,
      amount: +Number(r.amount).toFixed(2),
    }));
  }

  // --------- PRÓXIMOS VENCIMENTOS ---------
  private async getDueUpcoming(entityId: string, userId: string, to: Date) {
    const rows = await this.transactionRepository.getDueUpcoming(
      entityId,
      userId,
      to
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      dueDate: r.dueDate,
      value: +Number(r.value).toFixed(2),
    }));
  }

  // --------- IMPOSTO DO MÊS (estimado) ---------
  private async getMonthlyTax(
    entityId: string,
    userId: string,
    anyDateInMonth: Date
  ) {
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
