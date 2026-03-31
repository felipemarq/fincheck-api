import { Injectable } from "@kernel/decorators/Injectable";
import { GetBalancesQuery } from "@application/queries/GetBalancesQuery";
import { GetCashFlowQuery } from "@application/queries/GetCashFlowQuery";
import { GetMonthlyTaxQuery } from "@application/queries/GetMonthlyTaxQuery";
import { GetPayablesReceivablesSummaryQuery } from "@application/queries/GetPayablesReceivablesSummaryQuery";
import { GetTopCategoriesQuery } from "@application/queries/GetTopCategoriesQuery";
import { GetDueUpcomingQuery } from "@application/queries/GetDueUpcomingQuery";

// ==== helpers (copie estes) ====
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
function sameLengthPreviousRange(from: Date, to: Date) {
  const span = to.getTime() - from.getTime() + 1;
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - span + 1);
  return { prevFrom, prevTo };
}
function previousMonthMidpoint(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 15));
}
function buildDelta(current: number, prev: number) {
  const delta = +(current - prev).toFixed(2);
  const deltaPct =
    prev && Number.isFinite(prev) && Math.abs(prev) > 0
      ? +((delta / prev) * 100).toFixed(2)
      : null;
  const trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return {
    current: +current.toFixed(2),
    prev: +prev.toFixed(2),
    delta,
    deltaPct,
    trend,
  };
}
// =================================

@Injectable()
export class GetDashboardUseCase {
  constructor(
    private readonly getTopCategoriesQuery: GetTopCategoriesQuery,
    private readonly getDueUpcomingQuery: GetDueUpcomingQuery,
    private readonly getBalancesQuery: GetBalancesQuery,
    private readonly getCashFlowQuery: GetCashFlowQuery,
    private readonly getMonthlyTaxQuery: GetMonthlyTaxQuery,
    private readonly getPayablesReceivablesSummaryQuery: GetPayablesReceivablesSummaryQuery
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

    // ------ range atual ------
    let from = input.from;
    let to = input.to;
    if (input.range === "this-month") {
      from = startOfMonthUTC(now);
      to = endOfMonthUTC(now);
    } else if (input.range === "last-30d") {
      to = now;
      from = subDaysUTC(now, 29);
    }
    if (!from || !to) {
      from = startOfMonthUTC(now);
      to = endOfMonthUTC(now);
    }

    // ------ range anterior equivalente ------
    let prevFrom: Date;
    let prevTo: Date;
    if (input.range === "this-month") {
      const prevMid = previousMonthMidpoint(from);
      prevFrom = startOfMonthUTC(prevMid);
      prevTo = endOfMonthUTC(prevMid);
    } else {
      const r = sameLengthPreviousRange(from, to);
      prevFrom = r.prevFrom;
      prevTo = r.prevTo;
    }

    const want = (s: string) =>
      input.sections.length === 0 || input.sections.includes(s);

    // Tarefas atuais
    const tasksNow: Record<string, Promise<any>> = {};
    if (want("balances"))
      tasksNow.balances = this.getBalancesQuery.execute({
        entityId: input.entityId,
        userId: input.userId,
      });
    if (want("cashflow"))
      tasksNow.cashflow = this.getCashFlowQuery.execute({
        basis: input.basis,
        entityId: input.entityId,
        from,
        to,
        userId: input.userId,
      });
    if (want("topCategories"))
      tasksNow.topCategories = this.getTopCategoriesQuery.execute({
        entityId: input.entityId,
        userId: input.userId,
        from,
        to,
        topN: input.topN,
      });
    if (want("due"))
      tasksNow.due = this.getDueUpcomingQuery.execute({
        entityId: input.entityId,
        userId: input.userId,
        to,
      });
    if (want("tax"))
      tasksNow.tax = this.getMonthlyTaxQuery.execute({
        anyDateInMonth: from,
        entityId: input.entityId,
        userId: input.userId,
      });
    if (want("settlements"))
      tasksNow.settlements = this.getPayablesReceivablesSummaryQuery.execute({
        entityId: input.entityId,
        userId: input.userId,
        referenceDate: now,
      });

    // Tarefas "previous period" (só para as seções que fazem sentido comparar)
    const tasksPrev: Record<string, Promise<any>> = {};
    if (want("cashflow"))
      tasksPrev.cashflow = this.getCashFlowQuery.execute({
        basis: input.basis,
        entityId: input.entityId,
        from: prevFrom,
        to: prevTo,
        userId: input.userId,
      });
    if (want("tax"))
      tasksPrev.tax = this.getMonthlyTaxQuery.execute({
        anyDateInMonth:
          input.range === "this-month" ? previousMonthMidpoint(from) : prevFrom,
        entityId: input.entityId,
        userId: input.userId,
      });

    // Execução paralela
    const [nowResults, prevResults] = await Promise.all([
      Promise.all(
        Object.entries(tasksNow).map(async ([k, p]) => [k, await p] as const)
      ),
      Promise.all(
        Object.entries(tasksPrev).map(async ([k, p]) => [k, await p] as const)
      ),
    ]);

    const body: any = {
      range: { from, to },
      previousRange: { from: prevFrom, to: prevTo },
      generatedAt: new Date().toISOString(),
    };
    for (const [k, v] of nowResults) body[k] = v;

    // ---- insights (deltas prontos para UI) ----
    const insights: any = {};

    if (want("cashflow") && body.cashflow) {
      const prev = Object.fromEntries(prevResults)["cashflow"];
      const nowTotals = body.cashflow.totals;
      const prevTotals = prev?.totals ?? { income: 0, expense: 0, net: 0 };

      insights.cashflow = {
        income: buildDelta(nowTotals.income, prevTotals.income),
        expense: buildDelta(nowTotals.expense, prevTotals.expense),
        net: buildDelta(nowTotals.net, prevTotals.net),
      };
    }

    if (want("tax") && body.tax) {
      const prev = Object.fromEntries(prevResults)["tax"];
      insights.tax = {
        estimated: buildDelta(body.tax.estimatedTax, prev?.estimatedTax ?? 0),
        month: body.tax.month,
        prevMonth: prev?.month ?? null,
        missingRate: body.tax.missingRate,
      };
    }

    // (Opcional futuramente: insights.balances com snapshot as-of-date)

    if (Object.keys(insights).length) body.insights = insights;

    return body;
  }
}
