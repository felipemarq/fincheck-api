import assert from "node:assert/strict";
import test from "node:test";

import {
  Invoice,
  InvoiceItem,
  ReceivablePayment,
} from "@application/entities/Invoice";
import { buildReceivablesSummary } from "./buildReceivablesSummary";

const referenceDate = new Date("2026-08-11T12:00:00.000Z");

function makeInvoice({
  id,
  status = Invoice.Status.ISSUED,
  dueAt,
  amount,
  receivedAmount = 0,
}: {
  id: string;
  status?: Invoice.Status;
  dueAt: string;
  amount: number;
  receivedAmount?: number;
}) {
  return new Invoice({
    id,
    entityId: "entity-1",
    purchaseOrderId: "order-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    invoiceNumber: id,
    issuedAt: new Date("2026-08-01T12:00:00.000Z"),
    dueAt: new Date(dueAt),
    status,
    items: [
      new InvoiceItem({
        entityId: "entity-1",
        purchaseOrderItemId: `item-${id}`,
        invoicedQuantity: 1,
        unitPrice: amount,
      }),
    ],
    payments: receivedAmount
      ? [
          new ReceivablePayment({
            entityId: "entity-1",
            purchaseOrderId: "order-1",
            invoiceId: id,
            createdByUserId: "user-1",
            updatedByUserId: "user-1",
            receivedAt: referenceDate,
            amount: receivedAmount,
            paymentMethod: "PIX",
          }),
        ]
      : [],
  });
}

test("resume recebiveis vencidos, parciais e proximos sem perder centavos", () => {
  const summary = buildReceivablesSummary(
    [
      makeInvoice({
        id: "overdue",
        dueAt: "2026-08-10T12:00:00.000Z",
        amount: 100,
      }),
      makeInvoice({
        id: "today",
        dueAt: "2026-08-11T12:00:00.000Z",
        amount: 100,
        receivedAmount: 40,
      }),
      makeInvoice({
        id: "next-week",
        dueAt: "2026-08-16T12:00:00.000Z",
        amount: 80,
      }),
      makeInvoice({
        id: "received",
        dueAt: "2026-08-05T12:00:00.000Z",
        amount: 50,
        receivedAmount: 50,
      }),
      makeInvoice({
        id: "draft",
        status: Invoice.Status.DRAFT,
        dueAt: "2026-08-20T12:00:00.000Z",
        amount: 100,
      }),
    ],
    referenceDate
  );

  assert.deepEqual(summary, {
    totalCount: 5,
    issuedCount: 4,
    draftCount: 1,
    cancelledCount: 0,
    receivedCount: 1,
    partiallyReceivedCount: 1,
    billedAmount: 330,
    receivedAmount: 90,
    openCount: 3,
    openAmount: 240,
    overdueCount: 1,
    overdueAmount: 100,
    dueTodayCount: 1,
    dueTodayAmount: 60,
    dueNext7DaysCount: 1,
    dueNext7DaysAmount: 80,
  });
});
