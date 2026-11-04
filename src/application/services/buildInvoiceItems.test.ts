import assert from "node:assert/strict";
import test from "node:test";
import { InvoiceItem } from "@application/entities/Invoice";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { buildInvoiceItems } from "./buildInvoiceItems";

test("edição pelo formulário legado sem ID preserva os dados fiscais e a identidade do item", () => {
  const current = new InvoiceItem({
    id: "fiscal-item",
    entityId: "entity",
    purchaseOrderItemId: "order-item",
    lineNumber: 1,
    description: "Descrição original na nota",
    originalUnit: "UN",
    invoicedQuantity: 2,
    unitPrice: 10,
  });
  const changedOrder = {
    items: [
      {
        id: "order-item",
        lineNumber: 7,
        description: "Descrição da OC alterada",
        originalUnit: "CX",
      },
    ],
  } as PurchaseOrder;
  const [updated] = buildInvoiceItems(
    [{ purchaseOrderItemId: "order-item", invoicedQuantity: 3, unitPrice: 12 }],
    "entity",
    changedOrder,
    "invoice",
    [current],
  );
  assert.equal(updated.id, "fiscal-item");
  assert.equal(updated.description, "Descrição original na nota");
  assert.equal(updated.originalUnit, "UN");
  assert.equal(updated.lineNumber, 1);
  assert.equal(updated.totalAmount, 36);
});
