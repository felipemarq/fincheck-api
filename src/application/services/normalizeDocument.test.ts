import assert from "node:assert/strict";
import test from "node:test";

import { normalizeDocument } from "./normalizeDocument";

test("normaliza pontuacao e espacos sem perder caracteres do documento", () => {
  assert.equal(normalizeDocument(" 12.345.678/0001-90 "), "12345678000190");
  assert.equal(normalizeDocument(" ext-42/a "), "EXT42A");
});
