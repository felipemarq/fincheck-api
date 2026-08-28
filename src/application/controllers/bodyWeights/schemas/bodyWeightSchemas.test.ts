import assert from "node:assert/strict";
import test from "node:test";
import {
  bodyWeightParamsSchema,
  listBodyWeightsQuerySchema,
  upsertBodyWeightSchema,
} from "./bodyWeightSchemas";

test("aceita datas validas e peso decimal", () => {
  const params = bodyWeightParamsSchema.parse({ measuredOn: "2026-08-27" });
  const body = upsertBodyWeightSchema.parse({ weightKg: "82.375" });

  assert.equal(params.measuredOn, "2026-08-27");
  assert.equal(body.weightKg, 82.375);
});

test("rejeita datas inexistentes e intervalos invertidos", () => {
  assert.equal(
    bodyWeightParamsSchema.safeParse({ measuredOn: "2026-02-30" }).success,
    false
  );
  assert.equal(
    listBodyWeightsQuerySchema.safeParse({
      from: "2026-08-28",
      to: "2026-08-27",
    }).success,
    false
  );
});

test("rejeita pesos fora dos limites seguros do MVP", () => {
  assert.equal(upsertBodyWeightSchema.safeParse({ weightKg: 19.999 }).success, false);
  assert.equal(upsertBodyWeightSchema.safeParse({ weightKg: 500.001 }).success, false);
});
