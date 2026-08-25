import "reflect-metadata";

import assert from "node:assert/strict";
import test from "node:test";

import { Invoice } from "@application/entities/Invoice";
import {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@application/entities/PurchaseOrder";
import { CreateInvoiceUseCase } from "./CreateInvoiceUseCase";

const entityId = "entity-1";
const userId = "user-1";
const purchaseOrderId = "order-1";

function createOrderItem({
  id,
  lineNumber,
  invoicedQuantity,
}: {
  id: string;
  lineNumber: number;
  invoicedQuantity: number;
}) {
  return new PurchaseOrderItem({
    id,
    entityId,
    purchaseOrderId,
    productId: `product-${lineNumber}`,
    lineNumber,
    description: `Produto ${lineNumber}`,
    brand: "Outros",
    originalUnit: "UN",
    normalizedUnit: "UNIT",
    orderedQuantity: 5,
    saleUnitPrice: 100,
    officialTotal: 500,
    committedDeliveryQuantity: 5,
    deliveredQuantity: 5,
    invoicedQuantity,
  });
}

test("cria uma segunda nota usando apenas o saldo ainda nao faturado", async () => {
  const previouslyInvoicedItem = createOrderItem({
    id: "item-1",
    lineNumber: 1,
    invoicedQuantity: 5,
  });
  const pendingItem = createOrderItem({
    id: "item-2",
    lineNumber: 2,
    invoicedQuantity: 0,
  });
  const order = new PurchaseOrder({
    id: purchaseOrderId,
    entityId,
    customerId: "customer-1",
    createdByUserId: userId,
    updatedByUserId: userId,
    orderNumber: "OC-1",
    issuedAt: new Date("2026-08-01T12:00:00.000Z"),
    officialTotal: 1000,
    lifecycleStatus: PurchaseOrder.LifecycleStatus.ACTIVE,
    items: [previouslyInvoicedItem, pendingItem],
    invoiceCount: 1,
    invoicedRevenue: 500,
  });
  let createdInvoice: Invoice | undefined;
  const useCase = new CreateInvoiceUseCase(
    {
      findByNumber: async () => null,
      getInvoicedQuantityByOrderItem: async () =>
        new Map([[previouslyInvoicedItem.id!, 5]]),
      create: async (invoice: Invoice) => {
        createdInvoice = invoice;
        return invoice;
      },
    } as never,
    { findOne: async () => ({ order }) } as never,
    { assertUserAccess: async () => undefined } as never
  );

  const result = await useCase.execute({
    entityId,
    userId,
    purchaseOrderId,
    invoiceNumber: "NF-2",
    issuedAt: new Date("2026-08-11T12:00:00.000Z"),
    dueAt: new Date("2026-09-10T12:00:00.000Z"),
    status: Invoice.Status.ISSUED,
    items: [
      {
        purchaseOrderItemId: pendingItem.id!,
        invoicedQuantity: 5,
        unitPrice: 100,
      },
    ],
  });

  assert.equal(createdInvoice?.invoiceNumber, "NF-2");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].purchaseOrderItemId, pendingItem.id);
  assert.equal(result.items[0].invoicedQuantity, 5);
  assert.equal(result.grossAmount, 500);
});
