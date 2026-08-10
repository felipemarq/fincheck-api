import assert from "node:assert/strict";
import test from "node:test";

import { operationsDashboardQuerySchema } from "./dashboardSchemas";

test("converte um periodo valido do dashboard", () => {
  const parsed = operationsDashboardQuerySchema.parse({
    issuedFrom: "2026-07-11",
    issuedTo: "2026-08-09",
  });

  assert.equal(parsed.issuedFrom?.toISOString(), "2026-07-11T00:00:00.000Z");
  assert.equal(parsed.issuedTo?.toISOString(), "2026-08-09T00:00:00.000Z");
});

test("rejeita periodo incompleto ou invertido", () => {
  assert.equal(
    operationsDashboardQuerySchema.safeParse({
      issuedFrom: "2026-07-11",
    }).success,
    false
  );
  assert.equal(
    operationsDashboardQuerySchema.safeParse({
      issuedFrom: "2026-08-09",
      issuedTo: "2026-07-11",
    }).success,
    false
  );
});
