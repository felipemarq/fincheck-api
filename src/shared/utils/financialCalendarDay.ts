/** Dates on invoices are calendar dates; aging follows the business day in Brazil. */
export function financialCalendarDay(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)!.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}
