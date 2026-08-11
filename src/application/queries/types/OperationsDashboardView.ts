import { PurchaseOrder } from "@application/entities/PurchaseOrder";

export type OperationsDashboardView = {
  generatedAt: Date;
  operational: {
    activeOrders: number;
    pendingPurchaseOrders: number;
    awaitingReceiptOrders: number;
    readyForDeliveryOrders: number;
    inDeliveryOrders: number;
    delayedOrders: number;
  };
  financial: {
    contractedRevenue: number;
    acquisitionCost: number;
    deliveryCost: number;
    invoicedRevenue: number;
    taxCost: number;
    otherDeductions: number;
    receivedRevenue: number;
    receivableBalance: number;
    projectedMargin: number;
    costCoveredRevenue: number;
    knownCostMargin: number;
    invoicedMargin: number;
  };
  receivables: {
    openCount: number;
    openTotal: number;
    receivedCount: number;
    receivedTotal: number;
    overdueCount: number;
    overdueTotal: number;
    dueTodayCount: number;
    dueTodayTotal: number;
    dueNext7DaysCount: number;
    dueNext7DaysTotal: number;
  };
  attentionOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    progress: PurchaseOrder.Progress;
    requestedDeliveryAt?: Date;
    delayed: boolean;
    pendingPurchaseItems: number;
    awaitingReceiptItems: number;
    readyForDeliveryItems: number;
    receivableBalance: number;
  }>;
};
