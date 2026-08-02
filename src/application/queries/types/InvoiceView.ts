import {
  Invoice,
  ReceivablePayment,
} from "@application/entities/Invoice";
import { PurchaseOrderItem } from "@application/entities/PurchaseOrder";

export type InvoiceItemView = {
  id?: string;
  purchaseOrderItemId: string;
  lineNumber: number;
  description: string;
  originalUnit: string;
  invoicedQuantity: number;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
};

export type ReceivablePaymentView = {
  id?: string;
  receivedAt: Date;
  amount: number;
  paymentMethod: string;
  reference?: string;
  status: ReceivablePayment.Status;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type InvoiceView = {
  id?: string;
  entityId: string;
  purchaseOrderId: string;
  invoiceNumber: string;
  issuedAt: Date;
  dueAt: Date;
  grossAmount: number;
  taxAmount: number;
  otherDeductions: number;
  netReceivableAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  status: Invoice.Status;
  receivableStatus: Invoice.ReceivableStatus;
  notes?: string;
  items: InvoiceItemView[];
  payments: ReceivablePaymentView[];
  createdAt?: Date;
  updatedAt?: Date;
};

export function toReceivablePaymentView(
  payment: ReceivablePayment
): ReceivablePaymentView {
  return {
    id: payment.id,
    receivedAt: payment.receivedAt,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    reference: payment.reference,
    status: payment.status,
    notes: payment.notes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export function toInvoiceView(
  invoice: Invoice,
  purchaseOrderItems: PurchaseOrderItem[]
): InvoiceView {
  const orderItemsById = new Map(
    purchaseOrderItems.map((item) => [item.id, item])
  );

  return {
    id: invoice.id,
    entityId: invoice.entityId,
    purchaseOrderId: invoice.purchaseOrderId,
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    grossAmount: invoice.grossAmount,
    taxAmount: invoice.taxAmount,
    otherDeductions: invoice.otherDeductions,
    netReceivableAmount: invoice.netReceivableAmount,
    receivedAmount: invoice.receivedAmount,
    outstandingAmount: invoice.outstandingAmount,
    status: invoice.status,
    receivableStatus: invoice.receivableStatus,
    notes: invoice.notes,
    items: invoice.items.map((item) => {
      const orderItem = orderItemsById.get(item.purchaseOrderItemId);

      if (!orderItem) {
        throw new Error(
          `Item ${item.purchaseOrderItemId} nao encontrado na nota.`
        );
      }

      return {
        id: item.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        lineNumber: orderItem.lineNumber,
        description: orderItem.description,
        originalUnit: orderItem.originalUnit,
        invoicedQuantity: item.invoicedQuantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
        notes: item.notes,
      };
    }),
    payments: invoice.payments.map(toReceivablePaymentView),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}
