import { Invoice } from "@application/entities/Invoice";

export type ReceivablesSummary = {
  totalCount: number;
  issuedCount: number;
  draftCount: number;
  cancelledCount: number;
  receivedCount: number;
  partiallyReceivedCount: number;
  billedAmount: number;
  receivedAmount: number;
  openCount: number;
  openAmount: number;
  overdueCount: number;
  overdueAmount: number;
  dueTodayCount: number;
  dueTodayAmount: number;
  dueNext7DaysCount: number;
  dueNext7DaysAmount: number;
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

function startOfUtcDay(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}

export function buildReceivablesSummary(
  invoices: Invoice[],
  referenceDate = new Date()
): ReceivablesSummary {
  const today = startOfUtcDay(referenceDate);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const nextEightDays = new Date(today);
  nextEightDays.setUTCDate(nextEightDays.getUTCDate() + 8);
  const summary: ReceivablesSummary = {
    totalCount: invoices.length,
    issuedCount: 0,
    draftCount: 0,
    cancelledCount: 0,
    receivedCount: 0,
    partiallyReceivedCount: 0,
    billedAmount: 0,
    receivedAmount: 0,
    openCount: 0,
    openAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    dueTodayCount: 0,
    dueTodayAmount: 0,
    dueNext7DaysCount: 0,
    dueNext7DaysAmount: 0,
  };

  invoices.forEach((invoice) => {
    if (invoice.status === Invoice.Status.DRAFT) {
      summary.draftCount += 1;
      return;
    }

    if (invoice.status === Invoice.Status.CANCELLED) {
      summary.cancelledCount += 1;
      return;
    }

    summary.issuedCount += 1;
    summary.billedAmount += invoice.netReceivableAmount;
    summary.receivedAmount += invoice.receivedAmount;

    if (invoice.outstandingAmount <= 0) {
      summary.receivedCount += 1;
      return;
    }

    if (invoice.receivedAmount > 0) {
      summary.partiallyReceivedCount += 1;
    }

    summary.openCount += 1;
    summary.openAmount += invoice.outstandingAmount;

    if (invoice.dueAt.getTime() < today.getTime()) {
      summary.overdueCount += 1;
      summary.overdueAmount += invoice.outstandingAmount;
      return;
    }

    if (invoice.dueAt.getTime() < tomorrow.getTime()) {
      summary.dueTodayCount += 1;
      summary.dueTodayAmount += invoice.outstandingAmount;
      return;
    }

    if (invoice.dueAt.getTime() < nextEightDays.getTime()) {
      summary.dueNext7DaysCount += 1;
      summary.dueNext7DaysAmount += invoice.outstandingAmount;
    }
  });

  const moneyFields: Array<keyof ReceivablesSummary> = [
    "billedAmount",
    "receivedAmount",
    "openAmount",
    "overdueAmount",
    "dueTodayAmount",
    "dueNext7DaysAmount",
  ];
  moneyFields.forEach((field) => {
    summary[field] = roundMoney(summary[field]);
  });

  return summary;
}
