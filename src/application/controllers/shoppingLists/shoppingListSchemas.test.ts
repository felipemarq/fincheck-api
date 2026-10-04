import assert from "node:assert/strict";
import test from "node:test";
import { addShoppingItemsSchema, checkShoppingItemSchema, shoppingItemFields, updateShoppingItemSchema } from "./shoppingListSchemas";

test("aceita somente o link e mantém detalhes não informados como nulos", () => {
  const result = shoppingItemFields.parse({ url: " https://loja.com.br/item " });
  assert.equal(result.url, "https://loja.com.br/item");
  assert.equal(result.quantity, null);
  assert.equal(result.estimatedUnitPrice, null);
  assert.equal(result.productId, null);
  assert.equal(result.priority, "NORMAL");
});
test("rejeita scripts, protocolos não web e credenciais nos links", () => {
  for (const url of ["javascript:alert(1)", "ftp://loja.com/item", "https://usuario:senha@loja.com", "loja.com/item"]) {
    assert.equal(shoppingItemFields.safeParse({ url }).success, false);
  }
});
test("valida quantidade, estimativa e data sem exigir detalhes opcionais", () => {
  for (const patch of [{ quantity: 0 }, { quantity: -1 }, { quantity: 1.2345 }, { estimatedUnitPrice: -0.01 }, { neededBy: "2026-02-30" }]) {
    assert.equal(shoppingItemFields.safeParse({ url: "https://loja.com", ...patch }).success, false);
  }
  assert.equal(shoppingItemFields.parse({ url: "https://loja.com", quantity: 1.234, estimatedUnitPrice: 0 }).estimatedUnitPrice, 0);
});
test("limita a inclusão em lote e exige versão nas alterações", () => {
  assert.equal(addShoppingItemsSchema.safeParse({ items: [] }).success, false);
  assert.equal(addShoppingItemsSchema.safeParse({ items: Array.from({ length: 101 }, () => ({ url: "https://loja.com" })) }).success, false);
  assert.equal(updateShoppingItemSchema.safeParse({ url: "https://loja.com" }).success, false);
  assert.equal(checkShoppingItemSchema.safeParse({ purchased: true, version: 0 }).success, false);
});
