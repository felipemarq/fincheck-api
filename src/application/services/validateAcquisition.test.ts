import assert from "node:assert/strict";
import test from "node:test";

import {
  Acquisition,
  AcquisitionItem,
} from "@application/entities/Acquisition";
import {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { validateAcquisition } from "./validateAcquisition";

function makeOrder(): PurchaseOrder {
  return new PurchaseOrder({
    entityId: "entity-1",
    customerId: "customer-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    orderNumber: "OC-1",
    issuedAt: new Date("2026-07-30T12:00:00.000Z"),
    officialTotal: 100,
    lifecycleStatus: PurchaseOrder.LifecycleStatus.ACTIVE,
    items: [
      new PurchaseOrderItem({
        id: "order-item-1",
        entityId: "entity-1",
        purchaseOrderId: "order-1",
        productId: "product-1",
        lineNumber: 1,
        description: "Produto",
        brand: "Marca",
        originalUnit: "UN",
        normalizedUnit: "UNIT",
        orderedQuantity: 2,
        saleUnitPrice: 50,
        officialTotal: 100,
      }),
    ],
  });
}

function makeAcquisition(
  overrides: Partial<Acquisition.Attributes> = {},
  itemOverrides: Partial<AcquisitionItem.Attributes> = {}
): Acquisition {
  return new Acquisition({
    entityId: "entity-1",
    purchaseOrderId: "order-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    purchasedAt: new Date("2026-07-30T12:00:00.000Z"),
    buyerName: "Felipe",
    paymentMethod: "Cartao",
    items: [
      new AcquisitionItem({
        entityId: "entity-1",
        purchaseOrderItemId: "order-item-1",
        acquiredQuantity: 1,
        costUnitPrice: 20,
        ...itemOverrides,
      }),
    ],
    ...overrides,
  });
}

test("aceita uma aquisicao consistente com os itens da ordem", () => {
  assert.doesNotThrow(() =>
    validateAcquisition(makeAcquisition(), makeOrder())
  );
});

test("rejeita item de outra ordem e desconto acima do custo", () => {
  assert.throws(
    () =>
      validateAcquisition(
        makeAcquisition({}, { purchaseOrderItemId: "other-item" }),
        makeOrder()
      ),
    BadRequestException
  );

  assert.throws(
    () =>
      validateAcquisition(
        makeAcquisition({}, { lineDiscount: 21 }),
        makeOrder()
      ),
    BadRequestException
  );
});

test("rejeita identificacao de pagamento com mais de quatro digitos", () => {
  assert.throws(
    () =>
      validateAcquisition(
        makeAcquisition({ paymentInstrument: "Visa 123456" }),
        makeOrder()
      ),
    BadRequestException
  );
});
