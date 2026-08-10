import assert from "node:assert/strict";
import test from "node:test";
import {
  Acquisition,
  AcquisitionAllocation,
  AcquisitionItem,
} from "@application/entities/Acquisition";
import { calculateAcquisitionAllocationCosts } from "./calculateAcquisitionAllocationCosts";

function makeItem(productId: string, quantity: number, unitPrice: number) {
  return new AcquisitionItem({
    entityId: "entity-1",
    productId,
    acquiredQuantity: quantity,
    costUnitPrice: unitPrice,
    allocations: [
      new AcquisitionAllocation({
        entityId: "entity-1",
        purchaseOrderItemId: `order-item-${productId}`,
        allocatedQuantity: quantity,
      }),
    ],
  });
}

test("rateia o frete proporcionalmente e preserva todos os centavos", () => {
  const acquisition = new Acquisition({
    entityId: "entity-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    purchasedAt: new Date("2026-08-03T12:00:00.000Z"),
    buyerName: "Felipe",
    paymentMethod: Acquisition.PaymentMethod.PIX,
    shippingCost: 37,
    items: [makeItem("a", 1, 50), makeItem("b", 1, 250)],
  });

  const costs = calculateAcquisitionAllocationCosts(acquisition);
  const values = acquisition.items.map(
    (item) => costs.get(item.allocations[0])!
  );

  assert.deepEqual(values.map((value) => value.shippingCost), [6.17, 30.83]);
  assert.equal(values.reduce((sum, value) => sum + value.totalCost, 0), 337);
});

test("mantem a parte nao destinada fora do custo das ordens", () => {
  const item = makeItem("a", 2, 50);
  item.allocations[0] = new AcquisitionAllocation({
    entityId: "entity-1",
    purchaseOrderItemId: "order-item-a",
    allocatedQuantity: 1,
  });
  const acquisition = new Acquisition({
    entityId: "entity-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    purchasedAt: new Date("2026-08-03T12:00:00.000Z"),
    buyerName: "Felipe",
    paymentMethod: Acquisition.PaymentMethod.PIX,
    shippingCost: 10,
    items: [item],
  });

  const cost = calculateAcquisitionAllocationCosts(acquisition).get(
    item.allocations[0]
  )!;
  assert.equal(cost.totalCost, 55);
});
