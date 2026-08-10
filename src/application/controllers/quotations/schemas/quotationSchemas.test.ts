import assert from "node:assert/strict";
import test from "node:test";

import {
  createQuotationSchema,
  updateQuotationSchema,
  uploadQuotationImageSchema,
} from "./quotationSchemas";

const customerId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const quotationItemId = "33333333-3333-4333-8333-333333333333";

test("normaliza campos opcionais nulos ao criar uma cotacao", () => {
  const result = createQuotationSchema.parse({
    customerId,
    number: "COT-001",
    issuedAt: "2026-08-08T12:00:00.000Z",
    validUntil: null,
    sellerName: "JC Materiais Hospitalares",
    sellerDocument: null,
    sellerEmail: null,
    sellerPhone: null,
    sellerAddress: null,
    customerAddress: null,
    paymentTerms: null,
    deliveryTerms: null,
    notes: null,
    internalNotes: null,
    items: [
      {
        productId,
        lineNumber: 1,
        quantity: 2,
        unitPrice: 15.5,
        notes: null,
      },
    ],
  });

  assert.equal(result.validUntil, undefined);
  assert.equal(result.sellerEmail, undefined);
  assert.equal(result.items[0].notes, undefined);
  assert.equal(result.freight, 0);
  assert.equal(result.discount, 0);
});

test("rejeita numeros de linha repetidos na cotacao", () => {
  const result = createQuotationSchema.safeParse({
    customerId,
    number: "COT-002",
    issuedAt: "2026-08-08T12:00:00.000Z",
    sellerName: "JC Materiais Hospitalares",
    items: [
      { productId, lineNumber: 1, quantity: 1, unitPrice: 10 },
      { productId, lineNumber: 1, quantity: 1, unitPrice: 20 },
    ],
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0].path.join("."), "items.1.lineNumber");
  }
});

test("preserva ids validos e rejeita itens repetidos na atualizacao", () => {
  const input = {
    customerId,
    number: "COT-003",
    issuedAt: "2026-08-08T12:00:00.000Z",
    sellerName: "JC Materiais Hospitalares",
    items: [
      {
        id: quotationItemId,
        productId,
        lineNumber: 1,
        quantity: 1,
        unitPrice: 10,
      },
    ],
  };

  assert.equal(updateQuotationSchema.parse(input).items[0].id, quotationItemId);
  const duplicate = updateQuotationSchema.safeParse({
    ...input,
    items: [
      input.items[0],
      { ...input.items[0], lineNumber: 2 },
    ],
  });

  assert.equal(duplicate.success, false);
  if (!duplicate.success) {
    assert.equal(duplicate.error.issues[0].path.join("."), "items.1.id");
  }
});

test("aceita somente formatos de imagem suportados", () => {
  assert.equal(
    uploadQuotationImageSchema.safeParse({
      fileName: "produto.png",
      contentType: "image/png",
      dataBase64: "aGVsbG8=",
    }).success,
    true
  );
  assert.equal(
    uploadQuotationImageSchema.safeParse({
      fileName: "produto.svg",
      contentType: "image/svg+xml",
      dataBase64: "aGVsbG8=",
    }).success,
    false
  );
});
