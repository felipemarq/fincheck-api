import assert from "node:assert/strict";
import test from "node:test";

import {
  AcquisitionReceipt,
  AcquisitionReceiptItem,
} from "./AcquisitionReceipt";
import { Delivery, DeliveryItem } from "./Delivery";
import { Invoice, InvoiceItem, ReceivablePayment } from "./Invoice";

test("soma as quantidades dos eventos operacionais", () => {
  const receipt = new AcquisitionReceipt({
    entityId: "entity-1",
    purchaseOrderId: "order-1",
    acquisitionId: "acquisition-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    receivedAt: new Date(),
    items: [
      new AcquisitionReceiptItem({
        entityId: "entity-1",
        acquisitionItemId: "acquisition-item-1",
        purchaseOrderItemId: "order-item-1",
        receivedQuantity: 2,
      }),
      new AcquisitionReceiptItem({
        entityId: "entity-1",
        acquisitionItemId: "acquisition-item-2",
        purchaseOrderItemId: "order-item-2",
        receivedQuantity: 3,
      }),
    ],
  });
  const delivery = new Delivery({
    entityId: "entity-1",
    purchaseOrderId: "order-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    items: [
      new DeliveryItem({
        entityId: "entity-1",
        purchaseOrderItemId: "order-item-1",
        deliveredQuantity: 2,
      }),
    ],
  });

  assert.equal(receipt.totalQuantity, 5);
  assert.equal(delivery.totalQuantity, 2);
});

test("calcula saldo e situacao da conta a receber", () => {
  const invoice = new Invoice({
    entityId: "entity-1",
    purchaseOrderId: "order-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    invoiceNumber: "NF-1",
    issuedAt: new Date("2026-07-01T00:00:00.000Z"),
    dueAt: new Date("2099-07-30T00:00:00.000Z"),
    taxAmount: 10,
    otherDeductions: 5,
    status: Invoice.Status.ISSUED,
    items: [
      new InvoiceItem({
        entityId: "entity-1",
        purchaseOrderItemId: "order-item-1",
        invoicedQuantity: 2,
        unitPrice: 50,
      }),
    ],
    payments: [
      new ReceivablePayment({
        entityId: "entity-1",
        purchaseOrderId: "order-1",
        invoiceId: "invoice-1",
        createdByUserId: "user-1",
        updatedByUserId: "user-1",
        receivedAt: new Date("2026-07-20T00:00:00.000Z"),
        amount: 40,
        paymentMethod: "PIX",
      }),
    ],
  });

  assert.equal(invoice.grossAmount, 100);
  assert.equal(invoice.netReceivableAmount, 95);
  assert.equal(invoice.receivedAmount, 40);
  assert.equal(invoice.outstandingAmount, 55);
  assert.equal(
    invoice.receivableStatus,
    Invoice.ReceivableStatus.PARTIALLY_RECEIVED
  );
});
