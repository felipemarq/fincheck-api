import assert from "node:assert/strict";
import test from "node:test";

import {
  createAcquisitionSchema,
  updateAcquisitionSchema,
} from "./acquisitionSchemas";

const purchaseOrderItemId = "10a59f8f-a575-4da0-b9f0-869959b01f55";

const validItem = {
  purchaseOrderItemId,
  acquiredQuantity: "2.000",
  costUnitPrice: "19.90",
  lineDiscount: "1.00",
};

test("converte datas, quantidades e custos do contrato HTTP", () => {
  const parsed = createAcquisitionSchema.parse({
    purchasedAt: "2026-07-30",
    buyerName: "Felipe",
    paymentMethod: "PIX",
    shippingCost: "12.50",
    items: [validItem],
  });

  assert.equal(parsed.purchasedAt instanceof Date, true);
  assert.equal(parsed.shippingCost, 12.5);
  assert.equal(parsed.items[0].acquiredQuantity, 2);
  assert.equal(parsed.items[0].costUnitPrice, 19.9);
});

test("rejeita a mesma destinacao repetida no item", () => {
  const result = createAcquisitionSchema.safeParse({
    purchasedAt: "2026-07-30",
    buyerName: "Felipe",
    paymentMethod: "PIX",
    items: [
      {
        ...validItem,
        purchaseOrderItemId: undefined,
        productId: "71c532d5-30d2-4526-ae6e-3bb924de2544",
        allocations: [
          { purchaseOrderItemId, allocatedQuantity: 1 },
          { purchaseOrderItemId, allocatedQuantity: 1 },
        ],
      },
    ],
  });

  assert.equal(result.success, false);
});

test("nao permite informar manualmente estados derivados de recebimento", () => {
  const result = createAcquisitionSchema.safeParse({
    purchasedAt: "2026-07-30",
    buyerName: "Felipe",
    paymentMethod: "PIX",
    status: "RECEIVED",
    items: [validItem],
  });

  assert.equal(result.success, false);
});

test("exige cartao e vencimento nas compras no credito", () => {
  const result = createAcquisitionSchema.safeParse({
    purchasedAt: "2026-07-30",
    buyerName: "Felipe",
    paymentMethod: "CREDIT_CARD",
    installmentCount: 3,
    items: [validItem],
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(
      result.error.issues.map((issue) => issue.path.join(".")),
      ["creditCardId", "firstPaymentDueAt"]
    );
  }
});

test("aceita observacoes nulas nos itens de uma compra existente", () => {
  const parsed = updateAcquisitionSchema.parse({
    items: [
      {
        id: "9af699ef-9c96-4dda-bb9b-4a68539ceade",
        productId: "bf58d215-eae5-45a9-87e0-b6e59ebaedf5",
        acquiredQuantity: 10,
        costUnitPrice: 5.5,
        notes: null,
        allocations: [
          {
            id: "c1424981-ee78-47c8-93ae-431e2a496efa",
            purchaseOrderItemId,
            allocatedQuantity: 10,
            notes: null,
          },
        ],
      },
    ],
  });

  assert.equal(parsed.items?.[0].notes, undefined);
  assert.equal(parsed.items?.[0].allocations?.[0].notes, undefined);
});
