import "reflect-metadata";

import assert from "node:assert/strict";
import test from "node:test";

import {
  Invoice,
  InvoiceItem,
  ReceivablePayment,
} from "@application/entities/Invoice";
import { PurchaseOrderItem } from "@application/entities/PurchaseOrder";
import { ListReceivablesUseCase } from "./ListReceivablesUseCase";

const entityId = "entity-1";
const userId = "user-1";

function createOrderItem(id: string, description: string) {
  return new PurchaseOrderItem({
    id,
    entityId,
    purchaseOrderId: `order-${id}`,
    productId: `product-${id}`,
    lineNumber: 1,
    description,
    brand: "Outros",
    originalUnit: "UN",
    normalizedUnit: "UNIT",
    orderedQuantity: 1,
    saleUnitPrice: 100,
    officialTotal: 100,
  });
}

function createInvoice({
  id,
  item,
  dueAt,
  paymentAmount,
}: {
  id: string;
  item: PurchaseOrderItem;
  dueAt: Date;
  paymentAmount?: number;
}) {
  const invoiceItem = new InvoiceItem({
    id: `invoice-item-${id}`,
    entityId,
    invoiceId: id,
    purchaseOrderItemId: item.id!,
    invoicedQuantity: 1,
    unitPrice: 100,
  });
  const payments = paymentAmount
    ? [
        new ReceivablePayment({
          id: `payment-${id}`,
          entityId,
          purchaseOrderId: item.purchaseOrderId!,
          invoiceId: id,
          createdByUserId: userId,
          updatedByUserId: userId,
          receivedAt: new Date("2026-08-01T12:00:00.000Z"),
          amount: paymentAmount,
          paymentMethod: "PIX",
        }),
      ]
    : [];

  return new Invoice({
    id,
    entityId,
    purchaseOrderId: item.purchaseOrderId!,
    createdByUserId: userId,
    updatedByUserId: userId,
    invoiceNumber: `NF-${id}`,
    issuedAt: new Date("2026-08-01T12:00:00.000Z"),
    dueAt,
    status: Invoice.Status.ISSUED,
    items: [invoiceItem],
    payments,
  });
}

test("busca produtos sem acento e preserva o resumo global", async () => {
  const mattress = createOrderItem("item-1", "Colchao hospitalar");
  const fitting = createOrderItem("item-2", "Bucha de reducao");
  const overdueInvoice = createInvoice({
    id: "invoice-1",
    item: mattress,
    dueAt: new Date("2020-01-01T12:00:00.000Z"),
  });
  const partialInvoice = createInvoice({
    id: "invoice-2",
    item: fitting,
    dueAt: new Date("2099-01-01T12:00:00.000Z"),
    paymentAmount: 40,
  });
  const records = [
    {
      invoice: overdueInvoice,
      orderNumber: "OC-1",
      customerId: "customer-1",
      customerName: "Hospital Central",
      customerDocument: "123",
    },
    {
      invoice: partialInvoice,
      orderNumber: "OC-2",
      customerId: "customer-2",
      customerName: "Hospital Regional",
      customerDocument: "456",
    },
  ];
  const useCase = new ListReceivablesUseCase(
    { listAllForEntity: async () => records } as never,
    {
      findItemContexts: async () => [
        { item: mattress },
        { item: fitting },
      ],
    } as never,
    { assertUserAccess: async () => undefined } as never
  );

  const searchResult = await useCase.execute({
    entityId,
    userId,
    search: "colchao",
    status: "PENDING",
    sort: "URGENCY",
    page: 1,
    pageSize: 10,
  });

  assert.equal(searchResult.pagination.total, 1);
  assert.equal(searchResult.receivables[0].invoiceNumber, "NF-invoice-1");
  assert.equal(searchResult.summary.openCount, 2);
  assert.equal(searchResult.summary.openAmount, 160);
  assert.equal(searchResult.summary.overdueCount, 1);
  assert.equal(searchResult.summary.partiallyReceivedCount, 1);

  const partialResult = await useCase.execute({
    entityId,
    userId,
    status: Invoice.ReceivableStatus.PARTIALLY_RECEIVED,
    sort: "URGENCY",
    page: 1,
    pageSize: 10,
  });

  assert.equal(partialResult.pagination.total, 1);
  assert.equal(partialResult.receivables[0].invoiceNumber, "NF-invoice-2");
  assert.equal(partialResult.receivables[0].outstandingAmount, 60);
});
