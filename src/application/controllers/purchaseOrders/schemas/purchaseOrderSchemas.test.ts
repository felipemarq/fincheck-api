import assert from "node:assert/strict";
import test from "node:test";

import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
} from "./purchaseOrderSchemas";

const validItem = {
  productId: "ef631136-0e21-4c53-acf5-7cfab52f71dd",
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

test("aceita campos opcionais nulos nos itens durante a edicao", () => {
  const parsed = updatePurchaseOrderSchema.parse({
    items: [
      {
        ...validItem,
        id: "ee55cd16-48a1-48cf-aeda-3e50719ae29f",
        specification: null,
        notes: null,
      },
    ],
  });

  assert.equal(parsed.items?.[0].specification, undefined);
  assert.equal(parsed.items?.[0].notes, undefined);
});
