import { Invoice } from "@application/entities/Invoice";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { OperationsDashboardView } from "@application/queries/types/OperationsDashboardView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable()
export class GetOperationsDashboardUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute({
    entityId,
    userId,
  }: GetOperationsDashboardUseCase.Input): Promise<OperationsDashboardView> {
    await this.organizationAccessService.assertUserAccess(entityId, userId);

    const records = await this.purchaseOrderRepository.listAll({ entityId });
    const activeRecords = records.filter(
      ({ order }) =>
        order.lifecycleStatus === PurchaseOrder.LifecycleStatus.ACTIVE
    );
    const invoicesByOrder = new Map(
      await Promise.all(
        activeRecords.map(async ({ order }) => [
          order.id!,
          await this.invoiceRepository.listAll({
            entityId,
            purchaseOrderId: order.id!,
          }),
        ] as const)
      )
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const operational = {
      activeOrders: activeRecords.length,
      pendingPurchaseOrders: 0,
      awaitingReceiptOrders: 0,
      readyForDeliveryOrders: 0,
      inDeliveryOrders: 0,
      delayedOrders: 0,
    };
    const financial = {
      contractedRevenue: 0,
      acquisitionCost: 0,
      deliveryCost: 0,
      invoicedRevenue: 0,
      taxCost: 0,
      otherDeductions: 0,
      receivedRevenue: 0,
      receivableBalance: 0,
      projectedMargin: 0,
      invoicedMargin: 0,
    };
    const receivables = {
      openCount: 0,
      overdueCount: 0,
      overdueTotal: 0,
      dueTodayCount: 0,
      dueTodayTotal: 0,
    };

    const attentionOrders = activeRecords.map(({ order, customer }) => {
      const pendingPurchaseItems = order.items.filter(
        (item) => item.purchasePendingQuantity > 0
      ).length;
      const awaitingReceiptItems = order.items.filter(
        (item) => item.receiptPendingQuantity > 0
      ).length;
      const readyForDeliveryItems = order.items.filter(
        (item) => item.availableForDeliveryQuantity > 0
      ).length;
      const delayed = Boolean(
        order.requestedDeliveryAt &&
          order.requestedDeliveryAt.getTime() < today.getTime() &&
          order.progress !== PurchaseOrder.Progress.DELIVERED
      );

      operational.pendingPurchaseOrders +=
        pendingPurchaseItems > 0 ? 1 : 0;
      operational.awaitingReceiptOrders +=
        awaitingReceiptItems > 0 ? 1 : 0;
      operational.readyForDeliveryOrders +=
        readyForDeliveryItems > 0 ? 1 : 0;
      operational.inDeliveryOrders +=
        order.progress === PurchaseOrder.Progress.IN_DELIVERY ? 1 : 0;
      operational.delayedOrders += delayed ? 1 : 0;

      financial.contractedRevenue += order.officialTotal;
      financial.acquisitionCost += order.knownAcquisitionCost;
      financial.deliveryCost += order.deliveryCost;
      financial.invoicedRevenue += order.invoicedRevenue;
      financial.taxCost += order.taxCost;
      financial.otherDeductions += order.otherDeductions;
      financial.receivedRevenue += order.receivedRevenue;
      financial.receivableBalance += order.receivableBalance;
      financial.projectedMargin += order.projectedMargin;
      financial.invoicedMargin += order.invoicedMargin;

      (invoicesByOrder.get(order.id!) ?? []).forEach((invoice) => {
        if (
          invoice.status !== Invoice.Status.ISSUED ||
          invoice.outstandingAmount <= 0
        ) {
          return;
        }

        receivables.openCount += 1;

        if (invoice.dueAt.getTime() < today.getTime()) {
          receivables.overdueCount += 1;
          receivables.overdueTotal += invoice.outstandingAmount;
        } else if (invoice.dueAt.getTime() < tomorrow.getTime()) {
          receivables.dueTodayCount += 1;
          receivables.dueTodayTotal += invoice.outstandingAmount;
        }
      });

      return {
        id: order.id!,
        orderNumber: order.orderNumber,
        customerName: customer.tradeName || customer.legalName,
        progress: order.progress,
        requestedDeliveryAt: order.requestedDeliveryAt,
        delayed,
        pendingPurchaseItems,
        awaitingReceiptItems,
        readyForDeliveryItems,
        receivableBalance: order.receivableBalance,
      };
    });

    Object.keys(financial).forEach((key) => {
      const typedKey = key as keyof typeof financial;
      financial[typedKey] = roundMoney(financial[typedKey]);
    });
    receivables.overdueTotal = roundMoney(receivables.overdueTotal);
    receivables.dueTodayTotal = roundMoney(receivables.dueTodayTotal);

    return {
      generatedAt: new Date(),
      operational,
      financial,
      receivables,
      attentionOrders: attentionOrders
        .filter(
          (order) =>
            order.delayed ||
            order.pendingPurchaseItems > 0 ||
            order.awaitingReceiptItems > 0 ||
            order.readyForDeliveryItems > 0 ||
            order.receivableBalance > 0
        )
        .sort((a, b) => {
          if (a.delayed !== b.delayed) {
            return a.delayed ? -1 : 1;
          }

          return (
            (a.requestedDeliveryAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (b.requestedDeliveryAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
          );
        })
        .slice(0, 8),
    };
  }
}

export namespace GetOperationsDashboardUseCase {
  export type Input = {
    entityId: string;
    userId: string;
  };
}
