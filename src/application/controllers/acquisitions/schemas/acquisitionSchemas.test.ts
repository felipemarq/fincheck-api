import assert from "node:assert/strict";
import test from "node:test";

import { createAcquisitionSchema } from "./acquisitionSchemas";

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
    paymentMethod: "Cartao",
    shippingCost: "12.50",
    items: [validItem],
  });

  assert.equal(parsed.purchasedAt instanceof Date, true);
  assert.equal(parsed.shippingCost, 12.5);
  assert.equal(parsed.items[0].acquiredQuantity, 2);
  assert.equal(parsed.items[0].costUnitPrice, 19.9);
});

test("rejeita o mesmo item repetido na aquisicao", () => {
  const result = createAcquisitionSchema.safeParse({
    purchasedAt: "2026-07-30",
    buyerName: "Felipe",
    paymentMethod: "Cartao",
    items: [validItem, { ...validItem }],
  });

  assert.equal(result.success, false);
});

test("nao permite informar manualmente estados derivados de recebimento", () => {
  const result = createAcquisitionSchema.safeParse({
    purchasedAt: "2026-07-30",
    buyerName: "Felipe",
    paymentMethod: "Cartao",
    status: "RECEIVED",
    items: [validItem],
  });

  assert.equal(result.success, false);
});
