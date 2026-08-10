export const purchaseOrderItemProcurementStatuses = [
  "PENDING_PURCHASE",
  "PARTIALLY_PURCHASED",
  "PURCHASED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
] as const;

export type PurchaseOrderItemProcurementStatus =
  (typeof purchaseOrderItemProcurementStatuses)[number];

export const purchaseOrderItemDeadlineFilters = [
  "OVERDUE",
  "NEXT_7_DAYS",
  "NO_DATE",
] as const;

export type PurchaseOrderItemDeadlineFilter =
  (typeof purchaseOrderItemDeadlineFilters)[number];

export const purchaseOrderItemSortOptions = [
  "URGENCY",
  "DELIVERY_ASC",
  "DELIVERY_DESC",
  "NEWEST",
  "PRODUCT_ASC",
  "ORDER_ASC",
] as const;

export type PurchaseOrderItemSort =
  (typeof purchaseOrderItemSortOptions)[number];

export type PurchaseOrderItemQueueItem = {
  id: string;
  productId: string;
  productCode?: string;
  lineNumber: number;
  description: string;
  brand: string;
  specification?: string;
  originalUnit: string;
  orderedQuantity: number;
  saleUnitPrice: number;
  officialTotal: number;
  acquiredQuantity: number;
  purchasePendingQuantity: number;
  receivedQuantity: number;
  receiptPendingQuantity: number;
  procurementStatus: PurchaseOrderItemProcurementStatus;
  isOverdue: boolean;
  order: {
    id: string;
    orderNumber: string;
    externalNumber?: string;
    issuedAt: Date;
    requestedDeliveryAt?: Date;
  };
  customer: {
    id: string;
    legalName: string;
    tradeName?: string;
  };
};

export type PurchaseOrderItemQueueSummary = {
  total: number;
  pendingPurchase: number;
  partiallyPurchased: number;
  purchased: number;
  partiallyReceived: number;
  received: number;
  overdue: number;
};

export type PurchaseOrderItemQueuePage = {
  items: PurchaseOrderItemQueueItem[];
  summary: PurchaseOrderItemQueueSummary;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
