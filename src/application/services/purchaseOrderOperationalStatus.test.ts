import assert from "node:assert/strict";
import test from "node:test";

import {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@application/entities/PurchaseOrder";
import {
  getPurchaseOrderOperationalStatus,
  matchesPurchaseOrderOperationalStatus,
} from "./purchaseOrderOperationalStatus";

function makeOrder({
  acquiredQuantity = 0,
  receivedQuantity = 0,
  committedDeliveryQuantity = 0,
  requestedDeliveryAt,
}: {
  acquiredQuantity?: number;
  receivedQuantity?: number;
  committedDeliveryQuantity?: number;
  requestedDeliveryAt?: Date;
}) {
  return new PurchaseOrder({
    entityId: "fd0416b3-c7df-468d-bdc5-05aaca613214",
    customerId: "cad16ff9-c3f8-4050-bd61-27e7b7999e64",
    createdByUserId: "d81756a9-02bc-44b8-91df-7d5330107ce8",
    updatedByUserId: "d81756a9-02bc-44b8-91df-7d5330107ce8",
    orderNumber: "OC-1",
    issuedAt: new Date("2026-08-01T12:00:00.000Z"),
    requestedDeliveryAt,
    officialTotal: 100,
    lifecycleStatus: PurchaseOrder.LifecycleStatus.ACTIVE,
    items: [
      new PurchaseOrderItem({
        entityId: "fd0416b3-c7df-468d-bdc5-05aaca613214",
        productId: "45f92b13-4801-4244-99ca-2494ff46b0bb",
        lineNumber: 1,
        description: "Produto",
        brand: "Marca",
        originalUnit: "UN",
        normalizedUnit: "UNIT",
        orderedQuantity: 10,
        saleUnitPrice: 10,
        officialTotal: 100,
        acquiredQuantity,
        receivedQuantity,
        committedDeliveryQuantity,
      }),
    ],
  });
}

test("identifica as visoes de compra e recebimento usadas pelo painel", () => {
  const pending = getPurchaseOrderOperationalStatus(makeOrder({}));
  const awaiting = getPurchaseOrderOperationalStatus(
    makeOrder({ acquiredQuantity: 10 })
  );

  assert.equal(pending.pendingPurchase, true);
  assert.equal(pending.awaitingReceipt, false);
  assert.equal(awaiting.pendingPurchase, false);
  assert.equal(awaiting.awaitingReceipt, true);
});

test("identifica itens disponiveis para entrega e ordens em entrega", () => {
  const ready = makeOrder({
    acquiredQuantity: 10,
    receivedQuantity: 10,
  });
  const inDelivery = makeOrder({
    acquiredQuantity: 10,
    receivedQuantity: 10,
    committedDeliveryQuantity: 5,
  });

  assert.equal(
    matchesPurchaseOrderOperationalStatus(ready, "READY_FOR_DELIVERY"),
    true
  );
  assert.equal(
    matchesPurchaseOrderOperationalStatus(inDelivery, "IN_DELIVERY"),
    true
  );
});

test("identifica uma ordem ativa atrasada pela data solicitada", () => {
  const order = makeOrder({
    requestedDeliveryAt: new Date("2026-08-01T12:00:00.000Z"),
  });

  assert.equal(
    matchesPurchaseOrderOperationalStatus(
      order,
      "DELAYED",
      new Date("2026-08-08T12:00:00.000Z")
    ),
    true
  );
});
