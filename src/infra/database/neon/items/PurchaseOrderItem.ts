import {
  PurchaseOrder,
  PurchaseOrderItem as PurchaseOrderItemEntity,
} from "@application/entities/PurchaseOrder";
import type {
  NewPurchaseOrderItemRow,
  NewPurchaseOrderRow,
  PurchaseOrderItemRow,
  PurchaseOrderRow,
} from "../schema";

export class PurchaseOrderMapper {
  static fromRows(
    row: PurchaseOrderRow,
    itemRows: PurchaseOrderItemRow[]
  ): PurchaseOrder {
    return new PurchaseOrder({
      id: row.id,
      entityId: row.entityId,
      customerId: row.customerId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      orderNumber: row.orderNumber,
      externalNumber: row.externalNumber ?? undefined,
      quoteNumber: row.quoteNumber ?? undefined,
      requisitionNumber: row.requisitionNumber ?? undefined,
      issuedAt: row.issuedAt,
      requestedDeliveryAt: row.requestedDeliveryAt ?? undefined,
      officialTotal: Number(row.officialTotal),
      paymentTerms: row.paymentTerms ?? undefined,
      instructions: row.instructions ?? undefined,
      notes: row.notes ?? undefined,
      billingAddress: row.billingAddress ?? undefined,
      deliveryAddress: row.deliveryAddress ?? undefined,
      lifecycleStatus: row.lifecycleStatus as PurchaseOrder.LifecycleStatus,
      items: itemRows.map(PurchaseOrderMapper.itemFromRow),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(order: PurchaseOrder): NewPurchaseOrderRow {
    return {
      id: order.id,
      entityId: order.entityId,
      customerId: order.customerId,
      createdByUserId: order.createdByUserId,
      updatedByUserId: order.updatedByUserId,
      orderNumber: order.orderNumber,
      externalNumber: order.externalNumber ?? null,
      quoteNumber: order.quoteNumber ?? null,
      requisitionNumber: order.requisitionNumber ?? null,
      issuedAt: order.issuedAt,
      requestedDeliveryAt: order.requestedDeliveryAt ?? null,
      officialTotal: order.officialTotal.toFixed(2),
      paymentTerms: order.paymentTerms ?? null,
      instructions: order.instructions ?? null,
      notes: order.notes ?? null,
      billingAddress: order.billingAddress ?? null,
      deliveryAddress: order.deliveryAddress ?? null,
      lifecycleStatus: order.lifecycleStatus,
    };
  }

  static itemFromRow(row: PurchaseOrderItemRow): PurchaseOrderItemEntity {
    return new PurchaseOrderItemEntity({
      id: row.id,
      entityId: row.entityId,
      purchaseOrderId: row.purchaseOrderId,
      lineNumber: row.lineNumber,
      description: row.description,
      brand: row.brand,
      specification: row.specification ?? undefined,
      originalUnit: row.originalUnit,
      normalizedUnit: row.normalizedUnit,
      orderedQuantity: Number(row.orderedQuantity),
      saleUnitPrice: Number(row.saleUnitPrice),
      officialTotal: Number(row.officialTotal),
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static itemToRow(
    item: PurchaseOrderItemEntity,
    purchaseOrderId: string
  ): NewPurchaseOrderItemRow {
    return {
      id: item.id,
      entityId: item.entityId,
      purchaseOrderId,
      lineNumber: item.lineNumber,
      description: item.description,
      brand: item.brand,
      specification: item.specification ?? null,
      originalUnit: item.originalUnit,
      normalizedUnit: item.normalizedUnit,
      orderedQuantity: item.orderedQuantity.toFixed(3),
      saleUnitPrice: item.saleUnitPrice.toFixed(6),
      officialTotal: item.officialTotal.toFixed(2),
      notes: item.notes ?? null,
    };
  }
}
