import assert from "node:assert/strict";
import test from "node:test";

import {
  Acquisition,
  AcquisitionAllocation,
  AcquisitionItem,
} from "./Acquisition";

function makeItem(
  overrides: Partial<AcquisitionItem.Attributes> = {}
): AcquisitionItem {
  return new AcquisitionItem({
    entityId: "entity-1",
    productId: "product-1",
    acquiredQuantity: 3,
    costUnitPrice: 12.5,
    lineDiscount: 2.5,
    allocations: [
      new AcquisitionAllocation({
        entityId: "entity-1",
        purchaseOrderItemId: "item-1",
        allocatedQuantity: 3,
      }),
    ],
    ...overrides,
  });
}

function makeAcquisition(
  overrides: Partial<Acquisition.Attributes> = {}
): Acquisition {
  return new Acquisition({
    entityId: "entity-1",
    purchaseOrderId: "order-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    purchasedAt: new Date("2026-07-30T12:00:00.000Z"),
    buyerName: "Felipe",
    paymentMethod: "Cartao de credito",
    shippingCost: 10,
    generalDiscount: 3,
    otherExpenses: 5,
    items: [makeItem()],
    ...overrides,
  });
}

test("calcula custos de linha e custo conhecido da aquisicao", () => {
  const acquisition = makeAcquisition();

  assert.equal(acquisition.items[0].grossCost, 37.5);
  assert.equal(acquisition.items[0].totalCost, 35);
  assert.equal(acquisition.itemsSubtotal, 35);
  assert.equal(acquisition.totalCost, 47);
});

test("identifica cancelamento sem remover o registro", () => {
  const acquisition = makeAcquisition({
    status: Acquisition.Status.CANCELLED,
  });

  assert.equal(acquisition.isCancelled, true);
});
