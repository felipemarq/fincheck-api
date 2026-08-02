import {
  AcquisitionReceipt,
  AcquisitionReceiptItem as AcquisitionReceiptItemEntity,
} from "@application/entities/AcquisitionReceipt";
import type {
  AcquisitionReceiptItemRow,
  AcquisitionReceiptRow,
  NewAcquisitionReceiptItemRow,
  NewAcquisitionReceiptRow,
} from "../schema";

export class AcquisitionReceiptMapper {
  static fromRows(
    row: AcquisitionReceiptRow,
    itemRows: AcquisitionReceiptItemRow[]
  ): AcquisitionReceipt {
    return new AcquisitionReceipt({
      id: row.id,
      entityId: row.entityId,
      purchaseOrderId: row.purchaseOrderId,
      acquisitionId: row.acquisitionId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      receivedAt: row.receivedAt,
      status: row.status as AcquisitionReceipt.Status,
      notes: row.notes ?? undefined,
      items: itemRows.map((item) =>
        AcquisitionReceiptMapper.itemFromRow(item)
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(
    receipt: AcquisitionReceipt
  ): NewAcquisitionReceiptRow {
    return {
      id: receipt.id,
      entityId: receipt.entityId,
      purchaseOrderId: receipt.purchaseOrderId,
      acquisitionId: receipt.acquisitionId,
      createdByUserId: receipt.createdByUserId,
      updatedByUserId: receipt.updatedByUserId,
      receivedAt: receipt.receivedAt,
      status: receipt.status,
      notes: receipt.notes ?? null,
    };
  }

  static itemFromRow(
    row: AcquisitionReceiptItemRow
  ): AcquisitionReceiptItemEntity {
    return new AcquisitionReceiptItemEntity({
      id: row.id,
      entityId: row.entityId,
      receiptId: row.receiptId,
      acquisitionItemId: row.acquisitionItemId,
      purchaseOrderItemId: row.purchaseOrderItemId,
      receivedQuantity: Number(row.receivedQuantity),
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static itemToRow(
    item: AcquisitionReceiptItemEntity,
    receiptId: string
  ): NewAcquisitionReceiptItemRow {
    return {
      id: item.id,
      entityId: item.entityId,
      receiptId,
      acquisitionItemId: item.acquisitionItemId,
      purchaseOrderItemId: item.purchaseOrderItemId,
      receivedQuantity: item.receivedQuantity.toFixed(3),
      notes: item.notes ?? null,
    };
  }
}
