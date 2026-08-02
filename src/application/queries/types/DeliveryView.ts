import { Delivery } from "@application/entities/Delivery";
import { PurchaseOrderItem } from "@application/entities/PurchaseOrder";

export type DeliveryItemView = {
  id?: string;
  purchaseOrderItemId: string;
  lineNumber: number;
  description: string;
  originalUnit: string;
  deliveredQuantity: number;
  notes?: string;
};

export type DeliveryView = {
  id?: string;
  entityId: string;
  purchaseOrderId: string;
  status: Delivery.Status;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  freightCost: number;
  notes?: string;
  totalQuantity: number;
  items: DeliveryItemView[];
  createdAt?: Date;
  updatedAt?: Date;
};

export function toDeliveryView(
  delivery: Delivery,
  purchaseOrderItems: PurchaseOrderItem[]
): DeliveryView {
  const orderItemsById = new Map(
    purchaseOrderItems.map((item) => [item.id, item])
  );

  return {
    id: delivery.id,
    entityId: delivery.entityId,
    purchaseOrderId: delivery.purchaseOrderId,
    status: delivery.status,
    dispatchedAt: delivery.dispatchedAt,
    deliveredAt: delivery.deliveredAt,
    freightCost: delivery.freightCost,
    notes: delivery.notes,
    totalQuantity: delivery.totalQuantity,
    items: delivery.items.map((item) => {
      const orderItem = orderItemsById.get(item.purchaseOrderItemId);

      if (!orderItem) {
        throw new Error(
          `Item ${item.purchaseOrderItemId} nao encontrado na entrega.`
        );
      }

      return {
        id: item.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        lineNumber: orderItem.lineNumber,
        description: orderItem.description,
        originalUnit: orderItem.originalUnit,
        deliveredQuantity: item.deliveredQuantity,
        notes: item.notes,
      };
    }),
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}
