import { DatabaseService } from "@infra/database/neon";
import { transactionsTable } from "@infra/database/neon/schema";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, eq, lte, sql } from "drizzle-orm";

function startOfDayUTC(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
}

function endOfDayUTC(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

function addDaysUTC(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class GetPayablesReceivablesSummaryQuery {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute({
    entityId,
    userId,
    referenceDate,
    horizonDays = 7,
  }: GetPayablesReceivablesSummaryQuery.Input): Promise<
    GetPayablesReceivablesSummaryQuery.Output
  > {
    const todayStart = startOfDayUTC(referenceDate);
    const todayEnd = endOfDayUTC(referenceDate);
    const horizonEnd = endOfDayUTC(addDaysUTC(referenceDate, horizonDays));

    const [{ data }] = await this.databaseService.db
      .select({
        data: {
          payableOpenTotal: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=false THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
          payableOpenCount: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=false THEN 1 ELSE 0 END),0)`,
          payableOverdueTotal: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} < ${todayStart} THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
          payableOverdueCount: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} < ${todayStart} THEN 1 ELSE 0 END),0)`,
          payableDueTodayTotal: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} >= ${todayStart} AND ${transactionsTable.dueDate} <= ${todayEnd} THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
          payableDueTodayCount: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} >= ${todayStart} AND ${transactionsTable.dueDate} <= ${todayEnd} THEN 1 ELSE 0 END),0)`,
          payableUpcomingTotal: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} > ${todayEnd} AND ${transactionsTable.dueDate} <= ${horizonEnd} THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
          payableUpcomingCount: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='EXPENSE' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} > ${todayEnd} AND ${transactionsTable.dueDate} <= ${horizonEnd} THEN 1 ELSE 0 END),0)`,
          receivableOpenTotal: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=false THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
          receivableOpenCount: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=false THEN 1 ELSE 0 END),0)`,
          receivableOverdueTotal: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} < ${todayStart} THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
          receivableOverdueCount: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} < ${todayStart} THEN 1 ELSE 0 END),0)`,
          receivableDueTodayTotal: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} >= ${todayStart} AND ${transactionsTable.dueDate} <= ${todayEnd} THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
          receivableDueTodayCount: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} >= ${todayStart} AND ${transactionsTable.dueDate} <= ${todayEnd} THEN 1 ELSE 0 END),0)`,
          receivableUpcomingTotal: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} > ${todayEnd} AND ${transactionsTable.dueDate} <= ${horizonEnd} THEN (${transactionsTable.value})::numeric ELSE 0 END),0)`,
          receivableUpcomingCount: sql<number>`coalesce(sum(CASE WHEN ${transactionsTable.type}='INCOME' AND ${transactionsTable.isPaid}=false AND ${transactionsTable.dueDate} > ${todayEnd} AND ${transactionsTable.dueDate} <= ${horizonEnd} THEN 1 ELSE 0 END),0)`,
        },
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.entityId, entityId),
          eq(transactionsTable.userId, userId)
        )
      );

    return {
      referenceDate: todayStart.toISOString(),
      horizonDays,
      payables: {
        openTotal: +Number(data.payableOpenTotal).toFixed(2),
        openCount: Number(data.payableOpenCount),
        overdueTotal: +Number(data.payableOverdueTotal).toFixed(2),
        overdueCount: Number(data.payableOverdueCount),
        dueTodayTotal: +Number(data.payableDueTodayTotal).toFixed(2),
        dueTodayCount: Number(data.payableDueTodayCount),
        upcomingTotal: +Number(data.payableUpcomingTotal).toFixed(2),
        upcomingCount: Number(data.payableUpcomingCount),
      },
      receivables: {
        openTotal: +Number(data.receivableOpenTotal).toFixed(2),
        openCount: Number(data.receivableOpenCount),
        overdueTotal: +Number(data.receivableOverdueTotal).toFixed(2),
        overdueCount: Number(data.receivableOverdueCount),
        dueTodayTotal: +Number(data.receivableDueTodayTotal).toFixed(2),
        dueTodayCount: Number(data.receivableDueTodayCount),
        upcomingTotal: +Number(data.receivableUpcomingTotal).toFixed(2),
        upcomingCount: Number(data.receivableUpcomingCount),
      },
    };
  }
}

export namespace GetPayablesReceivablesSummaryQuery {
  export type Summary = {
    openTotal: number;
    openCount: number;
    overdueTotal: number;
    overdueCount: number;
    dueTodayTotal: number;
    dueTodayCount: number;
    upcomingTotal: number;
    upcomingCount: number;
  };

  export type Input = {
    entityId: string;
    userId: string;
    referenceDate: Date;
    horizonDays?: number;
  };

  export type Output = {
    referenceDate: string;
    horizonDays: number;
    payables: Summary;
    receivables: Summary;
  };
}
