import assert from "node:assert/strict";
import test from "node:test";

import { calculateQuotationTotals } from "./calculateQuotationTotals";

test("calcula linhas, frete, desconto e total em centavos", () => {
  const result = calculateQuotationTotals({
    items: [
      { quantity: 3, unitPrice: 10.155 },
      { quantity: 2, unitPrice: 25 },
    ],
    freight: 12.5,
    discount: 2,
  });

  assert.deepEqual(result, {
    itemTotals: [30.47, 50],
    subtotal: 80.47,
    freight: 12.5,
    discount: 2,
    total: 90.97,
  });
});

test("rejeita desconto maior que a cotacao", () => {
  assert.throws(
    () =>
      calculateQuotationTotals({
        items: [{ quantity: 1, unitPrice: 10 }],
        discount: 11,
      }),
    /desconto nao pode ser maior/i
  );
});
