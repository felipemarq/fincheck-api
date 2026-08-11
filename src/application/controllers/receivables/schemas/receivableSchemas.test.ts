import assert from "node:assert/strict";
import test from "node:test";

import { listReceivablesQuerySchema } from "./receivableSchemas";

test("aplica a fila pendente e a urgencia como filtros padrao", () => {
  const parsed = listReceivablesQuerySchema.parse({});

  assert.deepEqual(parsed, {
    status: "PENDING",
    sort: "URGENCY",
    page: 1,
    pageSize: 20,
  });
});

test("converte filtros e rejeita intervalo de vencimento invertido", () => {
  const parsed = listReceivablesQuerySchema.parse({
    status: "OVERDUE",
    sort: "BALANCE_DESC",
    dueFrom: "2026-08-01",
    dueTo: "2026-08-31",
    page: "2",
    pageSize: "50",
  });

  assert.equal(parsed.dueFrom instanceof Date, true);
  assert.equal(parsed.page, 2);
  assert.equal(parsed.pageSize, 50);

  const invalid = listReceivablesQuerySchema.safeParse({
    dueFrom: "2026-09-01",
    dueTo: "2026-08-01",
  });
  assert.equal(invalid.success, false);
});
