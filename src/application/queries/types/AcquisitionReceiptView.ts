import { Acquisition } from "@application/entities/Acquisition";
import { AcquisitionReceipt } from "@application/entities/AcquisitionReceipt";
import { PurchaseOrderItem } from "@application/entities/PurchaseOrder";

export type AcquisitionReceiptItemView = {
  id?: string;
  acquisitionItemId: string;
  purchaseOrderItemId: string;
  lineNumber: number;
  description: string;
  originalUnit: string;
  acquiredQuantity: number;
  receivedQuantity: number;
  notes?: string;
};

export type AcquisitionReceiptView = {
  id?: string;
  entityId: string;
  purchaseOrderId: string;
  acquisitionId: string;
  receivedAt: Date;
  status: AcquisitionReceipt.Status;
  notes?: string;
  totalQuantity: number;
  items: AcquisitionReceiptItemView[];
  createdAt?: Date;
  updatedAt?: Date;
};

export function toAcquisitionReceiptView(
  receipt: AcquisitionReceipt,
  acquisition: Acquisition,
  purchaseOrderItems: PurchaseOrderItem[]
): AcquisitionReceiptView {
  const acquisitionItemsById = new Map(
    acquisition.items.map((item) => [item.id, item])
  );
  const orderItemsById = new Map(
    purchaseOrderItems.map((item) => [item.id, item])
  );

  return {
    id: receipt.id,
    entityId: receipt.entityId,
    purchaseOrderId: receipt.purchaseOrderId,
    acquisitionId: receipt.acquisitionId,
    receivedAt: receipt.receivedAt,
    status: receipt.status,
    notes: receipt.notes,
    totalQuantity: receipt.totalQuantity,
    items: receipt.items.map((item) => {
      const acquisitionItem = acquisitionItemsById.get(
        item.acquisitionItemId
      );
      const orderItem = orderItemsById.get(item.purchaseOrderItemId);

      if (!acquisitionItem || !orderItem) {
        throw new Error(
          `Item ${item.acquisitionItemId} nao encontrado no recebimento.`
        );
      }

      return {
        id: item.id,
        acquisitionItemId: item.acquisitionItemId,
        purchaseOrderItemId: item.purchaseOrderItemId,
        lineNumber: orderItem.lineNumber,
        description: orderItem.description,
        originalUnit: orderItem.originalUnit,
        acquiredQuantity: acquisitionItem.acquiredQuantity,
        receivedQuantity: item.receivedQuantity,
        notes: item.notes,
      };
    }),
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
  };
}
