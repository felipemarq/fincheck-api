import {
  Delivery,
  DeliveryItem as DeliveryItemEntity,
} from "@application/entities/Delivery";
import type {
  DeliveryItemRow,
  DeliveryRow,
  NewDeliveryItemRow,
  NewDeliveryRow,
} from "../schema";

export class DeliveryMapper {
  static fromRows(
    row: DeliveryRow,
    itemRows: DeliveryItemRow[]
  ): Delivery {
    return new Delivery({
      id: row.id,
      entityId: row.entityId,
      purchaseOrderId: row.purchaseOrderId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      status: row.status as Delivery.Status,
      dispatchedAt: row.dispatchedAt ?? undefined,
      deliveredAt: row.deliveredAt ?? undefined,
      recipientName: row.recipientName ?? undefined,
      trackingCode: row.trackingCode ?? undefined,
      freightCost: Number(row.freightCost),
      notes: row.notes ?? undefined,
      items: itemRows.map((item) => DeliveryMapper.itemFromRow(item)),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(delivery: Delivery): NewDeliveryRow {
    return {
      id: delivery.id,
      entityId: delivery.entityId,
      purchaseOrderId: delivery.purchaseOrderId,
      createdByUserId: delivery.createdByUserId,
      updatedByUserId: delivery.updatedByUserId,
      status: delivery.status,
      dispatchedAt: delivery.dispatchedAt ?? null,
      deliveredAt: delivery.deliveredAt ?? null,
      recipientName: delivery.recipientName ?? null,
      trackingCode: delivery.trackingCode ?? null,
      freightCost: delivery.freightCost.toFixed(2),
      notes: delivery.notes ?? null,
    };
  }

  static itemFromRow(row: DeliveryItemRow): DeliveryItemEntity {
    return new DeliveryItemEntity({
      id: row.id,
      entityId: row.entityId,
      deliveryId: row.deliveryId,
      purchaseOrderItemId: row.purchaseOrderItemId,
      deliveredQuantity: Number(row.deliveredQuantity),
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static itemToRow(
    item: DeliveryItemEntity,
    deliveryId: string
  ): NewDeliveryItemRow {
    return {
      id: item.id,
      entityId: item.entityId,
      deliveryId,
      purchaseOrderItemId: item.purchaseOrderItemId,
      deliveredQuantity: item.deliveredQuantity.toFixed(3),
      notes: item.notes ?? null,
    };
  }
}
