import assert from "node:assert/strict";
import test from "node:test";

import { PurchaseOrder, PurchaseOrderItem } from "./PurchaseOrder";

function makeItem(
  overrides: Partial<PurchaseOrderItem.Attributes> = {}
): PurchaseOrderItem {
  return new PurchaseOrderItem({
    entityId: "entity-1",
    lineNumber: 1,
    description: "Produto de teste",
    brand: "Marca",
    originalUnit: "UN",
    normalizedUnit: "UNIT",
    orderedQuantity: 2,
    saleUnitPrice: 10,
    officialTotal: 20,
    ...overrides,
  });
}

function makeOrder(
  overrides: Partial<PurchaseOrder.Attributes> = {}
): PurchaseOrder {
  return new PurchaseOrder({
    entityId: "entity-1",
    customerId: "customer-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    orderNumber: "OC-1",
    issuedAt: new Date("2026-07-30T00:00:00.000Z"),
    officialTotal: 30,
    items: [
      makeItem(),
      makeItem({ lineNumber: 2, officialTotal: 10 }),
    ],
    ...overrides,
  });
}

test("soma os totais oficiais dos itens em centavos", () => {
  const order = makeOrder({
    items: [
      makeItem({ officialTotal: 10.1 }),
      makeItem({ lineNumber: 2, officialTotal: 20.2 }),
    ],
    officialTotal: 30.3,
  });

  assert.equal(order.calculatedItemsTotal, 30.3);
  assert.equal(order.hasTotalMismatch, false);
});

test("sinaliza divergencia sem substituir o total oficial", () => {
  const order = makeOrder({ officialTotal: 31 });

  assert.equal(order.officialTotal, 31);
  assert.equal(order.calculatedItemsTotal, 30);
  assert.equal(order.hasTotalMismatch, true);
});

test("prioriza o ciclo de vida no progresso da ordem", () => {
  const order = makeOrder();

  assert.equal(order.progress, PurchaseOrder.Progress.DRAFT);
  assert.equal(
    order.lifecycleStatus,
    PurchaseOrder.LifecycleStatus.DRAFT
  );

  const activeOrder = makeOrder({
    lifecycleStatus: PurchaseOrder.LifecycleStatus.ACTIVE,
  });
  assert.equal(
    activeOrder.progress,
    PurchaseOrder.Progress.PENDING_PURCHASE
  );
});
