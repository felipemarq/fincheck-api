import { Acquisition } from "@application/entities/Acquisition";
import { Payable } from "@application/entities/Payable";

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function splitInCents(total: number, count: number): number[] {
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  return Array.from(
    { length: count },
    (_, index) => (base + (index < remainder ? 1 : 0)) / 100
  );
}

export function buildPaymentSchedule(acquisition: Acquisition): Payable[] {
  if (!acquisition.id) {
    throw new Error("A aquisicao precisa estar identificada para gerar parcelas.");
  }

  const isCreditCard =
    acquisition.paymentMethod === Acquisition.PaymentMethod.CREDIT_CARD;
  const isDeferred =
    isCreditCard ||
    acquisition.paymentMethod === Acquisition.PaymentMethod.BOLETO;
  const installmentCount = isCreditCard ? acquisition.installmentCount : 1;
  const firstDueAt = isDeferred
    ? acquisition.firstPaymentDueAt!
    : acquisition.purchasedAt;
  const amounts = splitInCents(acquisition.totalCost, installmentCount);
  const status = acquisition.isCancelled
    ? Payable.Status.CANCELLED
    : isDeferred
      ? Payable.Status.OPEN
      : Payable.Status.PAID;

  return amounts.map(
    (amount, index) =>
      new Payable({
        entityId: acquisition.entityId,
        acquisitionId: acquisition.id!,
        creditCardId: acquisition.creditCardId,
        createdByUserId: acquisition.createdByUserId,
        updatedByUserId: acquisition.updatedByUserId,
        description: acquisition.sellerName
          ? `Compra em ${acquisition.sellerName}`
          : "Compra operacional",
        paymentMethod: acquisition.paymentMethod,
        installmentNumber: index + 1,
        installmentCount,
        amount,
        dueAt: addMonths(firstDueAt, index),
        status,
        paidAt: status === Payable.Status.PAID ? acquisition.purchasedAt : undefined,
      })
  );
}
