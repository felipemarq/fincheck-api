// src/application/services/RecurringEngine.ts
export type RecurrenceKind = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

function startOfUTCDate(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}
function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 86400000);
}
function addWeeks(d: Date, n: number) {
  return addDays(d, 7 * n);
}
function addMonths(d: Date, n: number) {
  const dt = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate())
  );
  // ajusta para último dia do mês quando necessário
  if (dt.getUTCDate() !== d.getUTCDate()) {
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 0));
  }
  return dt;
}
function addYears(d: Date, n: number) {
  return new Date(
    Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate())
  );
}

export const RecurringEngine = {
  *occurrences(
    rule: {
      recurrence: RecurrenceKind;
      startDate: Date;
      endDate?: Date | null;
    },
    rangeStart: Date,
    rangeEnd: Date
  ): Generator<Date> {
    const start = startOfUTCDate(
      rule.startDate > rangeStart ? rule.startDate : rangeStart
    );
    const last = startOfUTCDate(
      rule.endDate && rule.endDate < rangeEnd ? rule.endDate : rangeEnd
    );
    if (start > last) return;

    switch (rule.recurrence) {
      case "DAILY": {
        let d = start;
        while (d <= last) {
          yield d;
          d = addDays(d, 1);
        }
        break;
      }
      case "WEEKLY": {
        let d = start;
        while (d <= last) {
          yield d;
          d = addWeeks(d, 1);
        }
        break;
      }
      case "MONTHLY": {
        let d = start;
        while (d <= last) {
          yield d;
          d = addMonths(d, 1);
        }
        break;
      }
      case "YEARLY": {
        let d = start;
        while (d <= last) {
          yield d;
          d = addYears(d, 1);
        }
        break;
      }
    }
  },
};
