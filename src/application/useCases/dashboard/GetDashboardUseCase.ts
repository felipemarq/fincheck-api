import { Injectable } from "@kernel/decorators/Injectable";
import { GetBalancesQuery } from "@application/queries/GetBalancesQuery";
import { GetCashFlowQuery } from "@application/queries/GetCashFlowQuery";
import { GetMonthlyTaxQuery } from "@application/queries/GetMonthlyTaxQuery";
import { GetTopCategoriesQuery } from "@application/queries/GetTopCategoriesQuery";
import { GetDueUpcomingQuery } from "@application/queries/GetDueUpcomingQuery";

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
    private readonly getTopCategoriesQuery: GetTopCategoriesQuery,
    private readonly getDueUpcomingQuery: GetDueUpcomingQuery,
    private readonly getBalancesQuery: GetBalancesQuery,
    private readonly getCashFlowQuery: GetCashFlowQuery,
    private readonly getMonthlyTaxQuery: GetMonthlyTaxQuery
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
      tasks.balances = this.getBalancesQuery.execute({
        entityId: input.entityId,
        userId: input.userId,
      });
    if (want("cashflow"))
      tasks.cashflow = this.getCashFlowQuery.execute({
        basis: input.basis,
        entityId: input.entityId,
        from: from!,
        to: to!,
        userId: input.userId,
      });
    if (want("topCategories"))
      tasks.topCategories = this.getTopCategoriesQuery.execute({
        entityId: input.entityId,
        userId: input.userId,
        from: from!,
        to: to!,
        topN: input.topN,
      });
    if (want("due"))
      tasks.due = this.getDueUpcomingQuery.execute({
        entityId: input.entityId,
        userId: input.userId,
        to: to!,
      });
    if (want("tax"))
      tasks.tax = this.getMonthlyTaxQuery.execute({
        anyDateInMonth: from!,
        entityId: input.entityId,
        userId: input.userId,
      });

    // ============================================

    const pairs = await Promise.all(
      Object.entries(tasks).map(async ([k, p]) => [k, await p] as const)
    );

    const body: any = {
      range: { from, to },
      generatedAt: new Date().toISOString(),
    };
    for (const [k, v] of pairs) body[k] = v;

    console.log("body", body);
    return body;
  }
}
