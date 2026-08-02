import assert from "node:assert/strict";
import test from "node:test";

import {
  createDeliverySchema,
  updateDeliverySchema,
} from "./deliverySchemas";

const validItem = {
  purchaseOrderItemId: "ee55cd16-48a1-48cf-aeda-3e50719ae29f",
  deliveredQuantity: 2,
};

test("cria entrega propria sem custo, destinatario ou rastreio", () => {
  const parsed = createDeliverySchema.parse({
    status: "PREPARING",
    recipientName: null,
    trackingCode: null,
    notes: null,
    items: [validItem],
  });

  assert.equal(parsed.freightCost, 0);
  assert.equal(parsed.notes, undefined);
  assert.equal("recipientName" in parsed, false);
  assert.equal("trackingCode" in parsed, false);
});

test("ignora campos legados ao atualizar uma entrega", () => {
  const parsed = updateDeliverySchema.parse({
    status: "DELIVERED",
    deliveredAt: "2026-07-31",
    recipientName: null,
    trackingCode: null,
    items: [validItem],
  });

  assert.equal(parsed.deliveredAt instanceof Date, true);
  assert.equal("recipientName" in parsed, false);
  assert.equal("trackingCode" in parsed, false);
});
