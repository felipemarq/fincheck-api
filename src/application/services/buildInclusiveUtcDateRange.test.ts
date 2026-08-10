import assert from "node:assert/strict";
import test from "node:test";

import { buildInclusiveUtcDateRange } from "./buildInclusiveUtcDateRange";

test("transforma o fim inclusivo no inicio do dia seguinte", () => {
  const range = buildInclusiveUtcDateRange(
    new Date("2026-07-11T18:30:00.000Z"),
    new Date("2026-08-09T22:15:00.000Z")
  );

  assert.equal(range.dateFrom?.toISOString(), "2026-07-11T00:00:00.000Z");
  assert.equal(range.dateBefore?.toISOString(), "2026-08-10T00:00:00.000Z");
});
