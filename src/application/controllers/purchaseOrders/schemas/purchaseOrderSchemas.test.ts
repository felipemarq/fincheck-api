import assert from "node:assert/strict";
import test from "node:test";

import { createPurchaseOrderSchema } from "./purchaseOrderSchemas";

const validItem = {
  lineNumber: 1,
  description: "Produto de teste",
  brand: "Marca",
  originalUnit: "UN",
  normalizedUnit: "UNIT",
  orderedQuantity: 2,
  saleUnitPrice: 10,
  officialTotal: 20,
};

test("converte datas e numeros recebidos no contrato HTTP", () => {
  const parsed = createPurchaseOrderSchema.parse({
    customerId: "e8b96b15-88ef-4a40-a5de-eb78d22fa3d0",
    orderNumber: "OC-1",
    issuedAt: "2026-07-30",
    officialTotal: "20.00",
    items: [{ ...validItem, orderedQuantity: "2.000" }],
  });

  assert.equal(parsed.issuedAt instanceof Date, true);
  assert.equal(parsed.officialTotal, 20);
  assert.equal(parsed.items[0].orderedQuantity, 2);
});

test("rejeita numeros de linha repetidos", () => {
  const result = createPurchaseOrderSchema.safeParse({
    customerId: "e8b96b15-88ef-4a40-a5de-eb78d22fa3d0",
    orderNumber: "OC-1",
    issuedAt: "2026-07-30",
    officialTotal: 40,
    items: [validItem, { ...validItem }],
  });

  assert.equal(result.success, false);
});
