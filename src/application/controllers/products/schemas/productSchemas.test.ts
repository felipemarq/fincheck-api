import assert from "node:assert/strict";
import test from "node:test";

import { createProductSchema, updateProductSchema } from "./productSchemas";

test("aplica os padroes do catalogo ao criar um produto", () => {
  const product = createProductSchema.parse({
    name: "Luva cirurgica",
    packaging: "CX",
  });

  assert.equal(product.brand, "Outros");
  assert.equal(product.normalizedUnit, "UNIT");
  assert.equal(product.lastPurchasePrice, undefined);
});

test("aceita limpar os precos e campos opcionais na edicao", () => {
  const product = updateProductSchema.parse({
    specification: null,
    lastPurchasePrice: null,
    lastPurchaseSource: null,
    lastSalePrice: null,
  });

  assert.equal(product.specification, null);
  assert.equal(product.lastPurchasePrice, null);
  assert.equal(product.lastSalePrice, null);
});
