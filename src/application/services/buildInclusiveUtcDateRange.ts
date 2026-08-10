export function buildInclusiveUtcDateRange(
  dateFrom?: Date,
  dateTo?: Date
): { dateFrom?: Date; dateBefore?: Date } {
  const normalizedFrom = dateFrom
    ? new Date(
        Date.UTC(
          dateFrom.getUTCFullYear(),
          dateFrom.getUTCMonth(),
          dateFrom.getUTCDate()
        )
      )
    : undefined;
  const dateBefore = dateTo
    ? new Date(
        Date.UTC(
          dateTo.getUTCFullYear(),
          dateTo.getUTCMonth(),
          dateTo.getUTCDate() + 1
        )
      )
    : undefined;

  return { dateFrom: normalizedFrom, dateBefore };
}
