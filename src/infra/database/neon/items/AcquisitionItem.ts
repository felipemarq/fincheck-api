import {
  Acquisition,
  AcquisitionItem as AcquisitionItemEntity,
} from "@application/entities/Acquisition";
import type {
  AcquisitionItemRow,
  AcquisitionRow,
  NewAcquisitionItemRow,
  NewAcquisitionRow,
} from "../schema";

export class AcquisitionMapper {
  static fromRows(
    row: AcquisitionRow,
    itemRows: AcquisitionItemRow[]
  ): Acquisition {
    return new Acquisition({
      id: row.id,
      entityId: row.entityId,
      purchaseOrderId: row.purchaseOrderId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      sellerName: row.sellerName ?? undefined,
      sellerDocument: row.sellerDocument ?? undefined,
      channel: row.channel ?? undefined,
      sellerOrderNumber: row.sellerOrderNumber ?? undefined,
      purchasedAt: row.purchasedAt,
      buyerName: row.buyerName,
      paymentMethod: row.paymentMethod,
      paymentInstrument: row.paymentInstrument ?? undefined,
      paymentHolder: row.paymentHolder ?? undefined,
      shippingCost: Number(row.shippingCost),
      generalDiscount: Number(row.generalDiscount),
      otherExpenses: Number(row.otherExpenses),
      status: row.status as Acquisition.Status,
      notes: row.notes ?? undefined,
      items: itemRows.map(AcquisitionMapper.itemFromRow),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(acquisition: Acquisition): NewAcquisitionRow {
    return {
      id: acquisition.id,
      entityId: acquisition.entityId,
      purchaseOrderId: acquisition.purchaseOrderId,
      createdByUserId: acquisition.createdByUserId,
      updatedByUserId: acquisition.updatedByUserId,
      sellerName: acquisition.sellerName ?? null,
      sellerDocument: acquisition.sellerDocument ?? null,
      channel: acquisition.channel ?? null,
      sellerOrderNumber: acquisition.sellerOrderNumber ?? null,
      purchasedAt: acquisition.purchasedAt,
      buyerName: acquisition.buyerName,
      paymentMethod: acquisition.paymentMethod,
      paymentInstrument: acquisition.paymentInstrument ?? null,
      paymentHolder: acquisition.paymentHolder ?? null,
      shippingCost: acquisition.shippingCost.toFixed(2),
      generalDiscount: acquisition.generalDiscount.toFixed(2),
      otherExpenses: acquisition.otherExpenses.toFixed(2),
      status: acquisition.status,
      notes: acquisition.notes ?? null,
    };
  }

  static itemFromRow(row: AcquisitionItemRow): AcquisitionItemEntity {
    return new AcquisitionItemEntity({
      id: row.id,
      entityId: row.entityId,
      acquisitionId: row.acquisitionId,
      purchaseOrderItemId: row.purchaseOrderItemId,
      acquiredQuantity: Number(row.acquiredQuantity),
      costUnitPrice: Number(row.costUnitPrice),
      lineDiscount: Number(row.lineDiscount),
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static itemToRow(
    item: AcquisitionItemEntity,
    acquisitionId: string
  ): NewAcquisitionItemRow {
    return {
      id: item.id,
      entityId: item.entityId,
      acquisitionId,
      purchaseOrderItemId: item.purchaseOrderItemId,
      acquiredQuantity: item.acquiredQuantity.toFixed(3),
      costUnitPrice: item.costUnitPrice.toFixed(6),
      lineDiscount: item.lineDiscount.toFixed(2),
      totalCost: item.totalCost.toFixed(2),
      notes: item.notes ?? null,
    };
  }
}
