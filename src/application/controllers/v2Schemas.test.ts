import assert from "node:assert/strict";
import test from "node:test";

import {
  nullableOptionalString,
  optionalString,
} from "./v2Schemas";

test("normaliza null como ausencia em textos opcionais", () => {
  assert.equal(optionalString(100).parse(null), undefined);
  assert.equal(optionalString(100).parse("   "), undefined);
});

test("preserva null quando a atualizacao usa o valor para limpar o campo", () => {
  assert.equal(nullableOptionalString(100).parse(null), null);
  assert.equal(nullableOptionalString(100).parse("   "), null);
});
