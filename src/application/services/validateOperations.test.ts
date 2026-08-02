import assert from "node:assert/strict";
import test from "node:test";

import { Acquisition, AcquisitionItem } from "@application/entities/Acquisition";
import {
  AcquisitionReceipt,
  AcquisitionReceiptItem,
} from "@application/entities/AcquisitionReceipt";
import { Delivery, DeliveryItem } from "@application/entities/Delivery";
import { Invoice, InvoiceItem } from "@application/entities/Invoice";
import {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import {
  validateDelivery,
  validateInvoice,
  validateReceipt,
} from "./validateOperations";

const orderItem = new PurchaseOrderItem({
  id: "order-item-1",
  entityId: "entity-1",
  purchaseOrderId: "order-1",
  productId: "product-1",
  lineNumber: 1,
  description: "Produto",
  brand: "Marca",
  originalUnit: "UN",
  normalizedUnit: "UNIT",
  orderedQuantity: 5,
  saleUnitPrice: 20,
  officialTotal: 100,
  acquiredQuantity: 5,
  receivedQuantity: 5,
  committedDeliveryQuantity: 3,
});

const order = new PurchaseOrder({
  id: "order-1",
  entityId: "entity-1",
  customerId: "customer-1",
  createdByUserId: "user-1",
  updatedByUserId: "user-1",
  orderNumber: "OC-1",
  issuedAt: new Date(),
  officialTotal: 100,
  lifecycleStatus: PurchaseOrder.LifecycleStatus.ACTIVE,
  items: [orderItem],
});

const acquisitionItem = new AcquisitionItem({
  id: "acquisition-item-1",
  entityId: "entity-1",
  acquisitionId: "acquisition-1",
  purchaseOrderItemId: "order-item-1",
  acquiredQuantity: 5,
  costUnitPrice: 10,
});

const acquisition = new Acquisition({
  id: "acquisition-1",
  entityId: "entity-1",
  purchaseOrderId: "order-1",
  createdByUserId: "user-1",
  updatedByUserId: "user-1",
  purchasedAt: new Date(),
  buyerName: "Felipe",
  paymentMethod: "PIX",
  items: [acquisitionItem],
});

test("rejeita recebimento acima da quantidade comprada", () => {
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
        receivedQuantity: 3,
      }),
    ],
  });

  assert.throws(
    () =>
      validateReceipt(
        receipt,
        acquisition,
        new Map([["acquisition-item-1", 3]])
      ),
    BadRequestException
  );
});

test("rejeita entrega acima da quantidade recebida", () => {
  const delivery = new Delivery({
    entityId: "entity-1",
    purchaseOrderId: "order-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    items: [
      new DeliveryItem({
        entityId: "entity-1",
        purchaseOrderItemId: "order-item-1",
        deliveredQuantity: 3,
      }),
    ],
  });

  assert.throws(
    () =>
      validateDelivery(
        delivery,
        order,
        new Map([["order-item-1", 3]])
      ),
    BadRequestException
  );
});

test("rejeita faturamento acima da quantidade separada", () => {
  const invoice = new Invoice({
    entityId: "entity-1",
    purchaseOrderId: "order-1",
    createdByUserId: "user-1",
    updatedByUserId: "user-1",
    invoiceNumber: "NF-1",
    issuedAt: new Date("2026-07-01"),
    dueAt: new Date("2026-08-01"),
    status: Invoice.Status.ISSUED,
    items: [
      new InvoiceItem({
        entityId: "entity-1",
        purchaseOrderItemId: "order-item-1",
        invoicedQuantity: 2,
        unitPrice: 20,
      }),
    ],
  });

  assert.throws(
    () =>
      validateInvoice(
        invoice,
        order,
        new Map([["order-item-1", 2]])
      ),
    BadRequestException
  );
});
