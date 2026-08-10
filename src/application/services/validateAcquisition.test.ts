import assert from "node:assert/strict";
import test from "node:test";

import {
  Acquisition,
  AcquisitionAllocation,
  AcquisitionItem,
} from "@application/entities/Acquisition";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { validateAcquisition } from "./validateAcquisition";

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
    paymentMethod: Acquisition.PaymentMethod.PIX,
    items: [
      new AcquisitionItem({
        entityId: "entity-1",
        productId: "product-1",
        acquiredQuantity: 1,
        costUnitPrice: 20,
        allocations: [
          new AcquisitionAllocation({
            entityId: "entity-1",
            purchaseOrderItemId: "order-item-1",
            allocatedQuantity: 1,
          }),
        ],
        ...itemOverrides,
      }),
    ],
    ...overrides,
  });
}

test("aceita uma aquisicao consistente com os itens da ordem", () => {
  assert.doesNotThrow(() => validateAcquisition(makeAcquisition()));
});

test("rejeita rateio acima da compra e desconto acima do custo", () => {
  assert.throws(
    () =>
      validateAcquisition(
        makeAcquisition({}, {
          allocations: [
            new AcquisitionAllocation({
              entityId: "entity-1",
              purchaseOrderItemId: "other-item",
              allocatedQuantity: 2,
            }),
          ],
        })
      ),
    BadRequestException
  );

  assert.throws(
    () =>
      validateAcquisition(makeAcquisition({}, { lineDiscount: 21 })),
    BadRequestException
  );
});

test("rejeita identificacao de pagamento com mais de quatro digitos", () => {
  assert.throws(
    () =>
      validateAcquisition(
        makeAcquisition({
          paymentMethod: Acquisition.PaymentMethod.DEBIT_CARD,
          paymentInstrument: "Visa 123456",
        })
      ),
    BadRequestException
  );
});
