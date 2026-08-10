import assert from "node:assert/strict";
import test from "node:test";

import { createCreditCardSchema } from "./creditCardSchemas";

test("aceita limite vazio ao criar um cartao", () => {
  const parsed = createCreditCardSchema.parse({
    name: "Cartao principal",
    holderName: "Felipe",
    bank: "Banco",
    brand: "VISA",
    lastFour: "1234",
    closingDay: 1,
    dueDay: 10,
    creditLimit: null,
  });

  assert.equal(parsed.creditLimit, undefined);
});
