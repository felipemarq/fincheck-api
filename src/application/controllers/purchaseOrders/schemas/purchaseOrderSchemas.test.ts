import assert from "node:assert/strict";
import test from "node:test";

import {
  createPurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
  listPurchaseOrderItemsQuerySchema,
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

test("aplica paginacao e ordenacao padrao na fila de itens", () => {
  const parsed = listPurchaseOrderItemsQuerySchema.parse({});

  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 20);
  assert.equal(parsed.sort, "URGENCY");
});

test("converte filtros HTTP da fila de itens", () => {
  const parsed = listPurchaseOrderItemsQuerySchema.parse({
    status: "PARTIALLY_PURCHASED",
    deadline: "OVERDUE",
    sort: "PRODUCT_ASC",
    page: "2",
    pageSize: "50",
  });

  assert.equal(parsed.status, "PARTIALLY_PURCHASED");
  assert.equal(parsed.deadline, "OVERDUE");
  assert.equal(parsed.sort, "PRODUCT_ASC");
  assert.equal(parsed.page, 2);
  assert.equal(parsed.pageSize, 50);
});

test("aceita filtros de situacao e progresso das ordens", () => {
  const parsed = listPurchaseOrdersQuerySchema.parse({
    lifecycleStatus: "ACTIVE",
    progress: "PARTIALLY_PURCHASED",
    operationalStatus: "PENDING_PURCHASE",
    issuedFrom: "2026-07-11",
    issuedTo: "2026-08-09",
  });

  assert.equal(parsed.lifecycleStatus, "ACTIVE");
  assert.equal(parsed.progress, "PARTIALLY_PURCHASED");
  assert.equal(parsed.operationalStatus, "PENDING_PURCHASE");
  assert.equal(parsed.issuedFrom?.toISOString(), "2026-07-11T00:00:00.000Z");
  assert.equal(parsed.issuedTo?.toISOString(), "2026-08-09T00:00:00.000Z");
});

test("rejeita filtro de emissao incompleto", () => {
  const result = listPurchaseOrdersQuerySchema.safeParse({
    issuedFrom: "2026-07-11",
  });

  assert.equal(result.success, false);
});
