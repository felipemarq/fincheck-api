import assert from "node:assert/strict";
import test from "node:test";

import { settleCreditCardStatementSchema } from "./payableSchemas";

const creditCardId = "11111111-1111-4111-8111-111111111111";

test("converte o mes da fatura e aceita a data de pagamento opcional", () => {
  const result = settleCreditCardStatementSchema.parse({
    creditCardId,
    year: "2026",
    month: "8",
    paidAt: null,
  });

  assert.equal(result.year, 2026);
  assert.equal(result.month, 8);
  assert.equal(result.paidAt, undefined);
});

test("rejeita um mes de fatura inexistente", () => {
  const result = settleCreditCardStatementSchema.safeParse({
    creditCardId,
    year: 2026,
    month: 13,
  });

  assert.equal(result.success, false);
});
