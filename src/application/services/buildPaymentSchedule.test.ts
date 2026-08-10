import assert from "node:assert/strict";
import test from "node:test";
import { Acquisition } from "@application/entities/Acquisition";
import { Payable } from "@application/entities/Payable";
import { buildPaymentSchedule } from "./buildPaymentSchedule";

function makeAcquisition(overrides: Partial<Acquisition.Attributes> = {}) {
  return new Acquisition({
    id: "8fbb9f13-9666-463b-b9bd-43405ae29a22",
    entityId: "cd577ddb-3826-4a54-9f38-5df2a3bb02af",
    purchaseOrderId: "f006dbef-93fe-49d7-8fc5-d7ca11e9b29f",
    createdByUserId: "7a18300b-c681-4330-a114-c15343db229f",
    updatedByUserId: "7a18300b-c681-4330-a114-c15343db229f",
    purchasedAt: new Date("2026-08-02T12:00:00.000Z"),
    buyerName: "Felipe",
    paymentMethod: Acquisition.PaymentMethod.CREDIT_CARD,
    creditCardId: "45a00353-08f3-44b8-a17d-1fe7e342581a",
    installmentCount: 3,
    firstPaymentDueAt: new Date("2026-09-10T12:00:00.000Z"),
    items: [],
    otherExpenses: 100,
    ...overrides,
  });
}

test("divide parcelas sem perder centavos", () => {
  const schedule = buildPaymentSchedule(makeAcquisition());

  assert.deepEqual(schedule.map((item) => item.amount), [33.34, 33.33, 33.33]);
  assert.deepEqual(
    schedule.map((item) => item.dueAt.toISOString()),
    [
      "2026-09-10T12:00:00.000Z",
      "2026-10-10T12:00:00.000Z",
      "2026-11-10T12:00:00.000Z",
    ]
  );
  assert.ok(schedule.every((item) => item.status === Payable.Status.OPEN));
});

test("marca pagamentos imediatos como pagos", () => {
  const schedule = buildPaymentSchedule(
    makeAcquisition({
      paymentMethod: Acquisition.PaymentMethod.PIX,
      creditCardId: undefined,
      installmentCount: 1,
      firstPaymentDueAt: undefined,
    })
  );

  assert.equal(schedule.length, 1);
  assert.equal(schedule[0].status, Payable.Status.PAID);
  assert.equal(schedule[0].paidAt?.toISOString(), "2026-08-02T12:00:00.000Z");
});
