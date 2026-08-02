import { Acquisition } from "@application/entities/Acquisition";
import { PurchaseOrderItem } from "@application/entities/PurchaseOrder";

export type AcquisitionItemView = {
  id?: string;
  purchaseOrderItemId: string;
  lineNumber: number;
  description: string;
  brand: string;
  originalUnit: string;
  normalizedUnit: string;
  orderedQuantity: number;
  acquiredQuantity: number;
  costUnitPrice: number;
  grossCost: number;
  lineDiscount: number;
  totalCost: number;
  notes?: string;
};

export type AcquisitionView = {
  id?: string;
  entityId: string;
  purchaseOrderId: string;
  sellerName?: string;
  sellerDocument?: string;
  channel?: string;
  sellerOrderNumber?: string;
  purchasedAt: Date;
  buyerName: string;
  paymentMethod: string;
  paymentInstrument?: string;
  paymentHolder?: string;
  shippingCost: number;
  generalDiscount: number;
  otherExpenses: number;
  status: Acquisition.Status;
  notes?: string;
  itemCount: number;
  itemsSubtotal: number;
  totalCost: number;
  items: AcquisitionItemView[];
  createdAt?: Date;
  updatedAt?: Date;
};

export function toAcquisitionView(
  acquisition: Acquisition,
  purchaseOrderItems: PurchaseOrderItem[]
): AcquisitionView {
  const orderItemsById = new Map(
    purchaseOrderItems.map((item) => [item.id, item])
  );

  return {
    id: acquisition.id,
    entityId: acquisition.entityId,
    purchaseOrderId: acquisition.purchaseOrderId,
    sellerName: acquisition.sellerName,
    sellerDocument: acquisition.sellerDocument,
    channel: acquisition.channel,
    sellerOrderNumber: acquisition.sellerOrderNumber,
    purchasedAt: acquisition.purchasedAt,
    buyerName: acquisition.buyerName,
    paymentMethod: acquisition.paymentMethod,
    paymentInstrument: acquisition.paymentInstrument,
    paymentHolder: acquisition.paymentHolder,
    shippingCost: acquisition.shippingCost,
    generalDiscount: acquisition.generalDiscount,
    otherExpenses: acquisition.otherExpenses,
    status: acquisition.status,
    notes: acquisition.notes,
    itemCount: acquisition.items.length,
    itemsSubtotal: acquisition.itemsSubtotal,
    totalCost: acquisition.totalCost,
    items: acquisition.items.map((item) => {
      const orderItem = orderItemsById.get(item.purchaseOrderItemId);

      if (!orderItem) {
        throw new Error(
          `Item da ordem ${item.purchaseOrderItemId} nao encontrado para a aquisicao.`
        );
      }

      return {
        id: item.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        lineNumber: orderItem.lineNumber,
        description: orderItem.description,
        brand: orderItem.brand,
        originalUnit: orderItem.originalUnit,
        normalizedUnit: orderItem.normalizedUnit,
        orderedQuantity: orderItem.orderedQuantity,
        acquiredQuantity: item.acquiredQuantity,
        costUnitPrice: item.costUnitPrice,
        grossCost: item.grossCost,
        lineDiscount: item.lineDiscount,
        totalCost: item.totalCost,
        notes: item.notes,
      };
    }),
    createdAt: acquisition.createdAt,
    updatedAt: acquisition.updatedAt,
  };
}
