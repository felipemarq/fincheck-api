import {
  Invoice,
  InvoiceItem as InvoiceItemEntity,
  ReceivablePayment,
} from "@application/entities/Invoice";
import type {
  InvoiceItemRow,
  InvoiceRow,
  NewInvoiceItemRow,
  NewInvoiceRow,
  NewReceivablePaymentRow,
  ReceivablePaymentRow,
} from "../schema";

export class InvoiceMapper {
  static fromRows(
    row: InvoiceRow,
    itemRows: InvoiceItemRow[],
    paymentRows: ReceivablePaymentRow[]
  ): Invoice {
    return new Invoice({
      id: row.id,
      entityId: row.entityId,
      purchaseOrderId: row.purchaseOrderId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      invoiceNumber: row.invoiceNumber,
      issuedAt: row.issuedAt,
      dueAt: row.dueAt,
      taxAmount: Number(row.taxAmount),
      otherDeductions: Number(row.otherDeductions),
      status: row.status as Invoice.Status,
      notes: row.notes ?? undefined,
      items: itemRows.map((item) => InvoiceMapper.itemFromRow(item)),
      payments: paymentRows.map((payment) =>
        InvoiceMapper.paymentFromRow(payment)
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(invoice: Invoice): NewInvoiceRow {
    return {
      id: invoice.id,
      entityId: invoice.entityId,
      purchaseOrderId: invoice.purchaseOrderId,
      createdByUserId: invoice.createdByUserId,
      updatedByUserId: invoice.updatedByUserId,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      grossAmount: invoice.grossAmount.toFixed(2),
      taxAmount: invoice.taxAmount.toFixed(2),
      otherDeductions: invoice.otherDeductions.toFixed(2),
      status: invoice.status,
      notes: invoice.notes ?? null,
    };
  }

  static itemFromRow(row: InvoiceItemRow): InvoiceItemEntity {
    return new InvoiceItemEntity({
      id: row.id,
      entityId: row.entityId,
      invoiceId: row.invoiceId,
      purchaseOrderItemId: row.purchaseOrderItemId,
      invoicedQuantity: Number(row.invoicedQuantity),
      unitPrice: Number(row.unitPrice),
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static itemToRow(
    item: InvoiceItemEntity,
    invoiceId: string
  ): NewInvoiceItemRow {
    return {
      id: item.id,
      entityId: item.entityId,
      invoiceId,
      purchaseOrderItemId: item.purchaseOrderItemId,
      invoicedQuantity: item.invoicedQuantity.toFixed(3),
      unitPrice: item.unitPrice.toFixed(6),
      totalAmount: item.totalAmount.toFixed(2),
      notes: item.notes ?? null,
    };
  }

  static paymentFromRow(row: ReceivablePaymentRow): ReceivablePayment {
    return new ReceivablePayment({
      id: row.id,
      entityId: row.entityId,
      purchaseOrderId: row.purchaseOrderId,
      invoiceId: row.invoiceId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      receivedAt: row.receivedAt,
      amount: Number(row.amount),
      paymentMethod: row.paymentMethod,
      reference: row.reference ?? undefined,
      status: row.status as ReceivablePayment.Status,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static paymentToRow(
    payment: ReceivablePayment
  ): NewReceivablePaymentRow {
    return {
      id: payment.id,
      entityId: payment.entityId,
      purchaseOrderId: payment.purchaseOrderId,
      invoiceId: payment.invoiceId,
      createdByUserId: payment.createdByUserId,
      updatedByUserId: payment.updatedByUserId,
      receivedAt: payment.receivedAt,
      amount: payment.amount.toFixed(2),
      paymentMethod: payment.paymentMethod,
      reference: payment.reference ?? null,
      status: payment.status,
      notes: payment.notes ?? null,
    };
  }
}
