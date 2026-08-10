import { PurchaseOrder } from "@application/entities/PurchaseOrder";

export const purchaseOrderOperationalStatuses = [
  "PENDING_PURCHASE",
  "AWAITING_RECEIPT",
  "READY_FOR_DELIVERY",
  "IN_DELIVERY",
  "DELAYED",
] as const;

export type PurchaseOrderOperationalStatus =
  (typeof purchaseOrderOperationalStatuses)[number];

export function getPurchaseOrderOperationalStatus(
  order: PurchaseOrder,
  referenceDate = new Date()
) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const active =
    order.lifecycleStatus === PurchaseOrder.LifecycleStatus.ACTIVE;

  return {
    pendingPurchase:
      active && order.items.some((item) => item.purchasePendingQuantity > 0),
    awaitingReceipt:
      active && order.items.some((item) => item.receiptPendingQuantity > 0),
    readyForDelivery:
      active &&
      order.items.some((item) => item.availableForDeliveryQuantity > 0),
    inDelivery:
      active && order.progress === PurchaseOrder.Progress.IN_DELIVERY,
    delayed: Boolean(
      active &&
        order.requestedDeliveryAt &&
        order.requestedDeliveryAt.getTime() < today.getTime() &&
        order.progress !== PurchaseOrder.Progress.DELIVERED
    ),
  };
}

export function matchesPurchaseOrderOperationalStatus(
  order: PurchaseOrder,
  status: PurchaseOrderOperationalStatus,
  referenceDate = new Date()
) {
  const operational = getPurchaseOrderOperationalStatus(order, referenceDate);

  switch (status) {
    case "PENDING_PURCHASE":
      return operational.pendingPurchase;
    case "AWAITING_RECEIPT":
      return operational.awaitingReceipt;
    case "READY_FOR_DELIVERY":
      return operational.readyForDelivery;
    case "IN_DELIVERY":
      return operational.inDelivery;
    case "DELAYED":
      return operational.delayed;
  }
}
