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
    itemRows: PurchaseOrderItemRow[],
    operationalData: {
      acquiredQuantityByItemId?: Map<string, number>;
      receivedQuantityByItemId?: Map<string, number>;
      committedDeliveryQuantityByItemId?: Map<string, number>;
      deliveredQuantityByItemId?: Map<string, number>;
      invoicedQuantityByItemId?: Map<string, number>;
      acquisitionCount?: number;
      knownAcquisitionCost?: number;
      deliveryCount?: number;
      deliveryCost?: number;
      invoiceCount?: number;
      invoicedRevenue?: number;
      taxCost?: number;
      otherDeductions?: number;
      receivedRevenue?: number;
      receivableBalance?: number;
    } = {}
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
      items: itemRows.map((itemRow) =>
        PurchaseOrderMapper.itemFromRow(
          itemRow,
          operationalData.acquiredQuantityByItemId?.get(itemRow.id) ?? 0,
          operationalData.receivedQuantityByItemId?.get(itemRow.id) ?? 0,
          operationalData.committedDeliveryQuantityByItemId?.get(
            itemRow.id
          ) ?? 0,
          operationalData.deliveredQuantityByItemId?.get(itemRow.id) ?? 0,
          operationalData.invoicedQuantityByItemId?.get(itemRow.id) ?? 0
        )
      ),
      acquisitionCount: operationalData.acquisitionCount,
      knownAcquisitionCost: operationalData.knownAcquisitionCost,
      deliveryCount: operationalData.deliveryCount,
      deliveryCost: operationalData.deliveryCost,
      invoiceCount: operationalData.invoiceCount,
      invoicedRevenue: operationalData.invoicedRevenue,
      taxCost: operationalData.taxCost,
      otherDeductions: operationalData.otherDeductions,
      receivedRevenue: operationalData.receivedRevenue,
      receivableBalance: operationalData.receivableBalance,
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

  static itemFromRow(
    row: PurchaseOrderItemRow,
    acquiredQuantity = 0,
    receivedQuantity = 0,
    committedDeliveryQuantity = 0,
    deliveredQuantity = 0,
    invoicedQuantity = 0
  ): PurchaseOrderItemEntity {
    return new PurchaseOrderItemEntity({
      id: row.id,
      entityId: row.entityId,
      purchaseOrderId: row.purchaseOrderId,
      productId: row.productId,
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
      acquiredQuantity,
      receivedQuantity,
      committedDeliveryQuantity,
      deliveredQuantity,
      invoicedQuantity,
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
      productId: item.productId,
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
