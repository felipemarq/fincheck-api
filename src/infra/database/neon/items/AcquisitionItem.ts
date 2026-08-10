import {
  Acquisition,
  AcquisitionAllocation,
  AcquisitionItem as AcquisitionItemEntity,
} from "@application/entities/Acquisition";
import type {
  AcquisitionItemRow,
  AcquisitionItemAllocationRow,
  AcquisitionRow,
  NewAcquisitionItemRow,
  NewAcquisitionItemAllocationRow,
  NewAcquisitionRow,
} from "../schema";

export class AcquisitionMapper {
  static fromRows(
    row: AcquisitionRow,
    itemRows: AcquisitionItemRow[],
    allocationRows: AcquisitionItemAllocationRow[]
  ): Acquisition {
    return new Acquisition({
      id: row.id,
      entityId: row.entityId,
      purchaseOrderId: row.purchaseOrderId ?? undefined,
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
      creditCardId: row.creditCardId ?? undefined,
      installmentCount: row.installmentCount,
      firstPaymentDueAt: row.firstPaymentDueAt ?? undefined,
      shippingCost: Number(row.shippingCost),
      generalDiscount: Number(row.generalDiscount),
      otherExpenses: Number(row.otherExpenses),
      status: row.status as Acquisition.Status,
      notes: row.notes ?? undefined,
      items: itemRows.map((item) =>
        AcquisitionMapper.itemFromRow(
          item,
          allocationRows.filter(
            (allocation) => allocation.acquisitionItemId === item.id
          )
        )
      ),
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
      creditCardId: acquisition.creditCardId ?? null,
      installmentCount: acquisition.installmentCount,
      firstPaymentDueAt: acquisition.firstPaymentDueAt ?? null,
      shippingCost: acquisition.shippingCost.toFixed(2),
      generalDiscount: acquisition.generalDiscount.toFixed(2),
      otherExpenses: acquisition.otherExpenses.toFixed(2),
      status: acquisition.status,
      notes: acquisition.notes ?? null,
    };
  }

  static itemFromRow(
    row: AcquisitionItemRow,
    allocationRows: AcquisitionItemAllocationRow[]
  ): AcquisitionItemEntity {
    return new AcquisitionItemEntity({
      id: row.id,
      entityId: row.entityId,
      acquisitionId: row.acquisitionId,
      productId: row.productId,
      acquiredQuantity: Number(row.acquiredQuantity),
      costUnitPrice: Number(row.costUnitPrice),
      lineDiscount: Number(row.lineDiscount),
      notes: row.notes ?? undefined,
      allocations: allocationRows.map(AcquisitionMapper.allocationFromRow),
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
      productId: item.productId,
      acquiredQuantity: item.acquiredQuantity.toFixed(3),
      costUnitPrice: item.costUnitPrice.toFixed(6),
      lineDiscount: item.lineDiscount.toFixed(2),
      totalCost: item.totalCost.toFixed(2),
      notes: item.notes ?? null,
    };
  }

  static allocationFromRow(
    row: AcquisitionItemAllocationRow
  ): AcquisitionAllocation {
    return new AcquisitionAllocation({
      id: row.id,
      entityId: row.entityId,
      acquisitionItemId: row.acquisitionItemId,
      purchaseOrderItemId: row.purchaseOrderItemId,
      allocatedQuantity: Number(row.allocatedQuantity),
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static allocationToRow(
    allocation: AcquisitionAllocation,
    acquisitionItemId: string
  ): NewAcquisitionItemAllocationRow {
    return {
      id: allocation.id,
      entityId: allocation.entityId,
      acquisitionItemId,
      purchaseOrderItemId: allocation.purchaseOrderItemId,
      allocatedQuantity: allocation.allocatedQuantity.toFixed(3),
      notes: allocation.notes ?? null,
    };
  }
}
