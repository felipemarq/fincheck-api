import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import {
  PurchaseOrderSummaryView,
  toPurchaseOrderSummary,
} from "@application/queries/types/PurchaseOrderView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { buildInclusiveUtcDateRange } from "@application/services/buildInclusiveUtcDateRange";
import {
  matchesPurchaseOrderOperationalStatus,
  PurchaseOrderOperationalStatus,
} from "@application/services/purchaseOrderOperationalStatus";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListPurchaseOrdersUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: ListPurchaseOrdersUseCase.Input
  ): Promise<ListPurchaseOrdersUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const issuedRange = buildInclusiveUtcDateRange(
      input.issuedFrom,
      input.issuedTo
    );
    const records = await this.purchaseOrderRepository.listAll({
      entityId: input.entityId,
      customerId: input.customerId,
      lifecycleStatus: input.lifecycleStatus,
      search: input.search,
      issuedFrom: issuedRange.dateFrom,
      issuedBefore: issuedRange.dateBefore,
    });
    const operationalStatus = input.operationalStatus;
    const filteredRecords = operationalStatus
      ? records.filter(({ order }) =>
          matchesPurchaseOrderOperationalStatus(order, operationalStatus)
        )
      : records;
    const summaries = filteredRecords.map(toPurchaseOrderSummary);

    return {
      orders: input.progress
        ? summaries.filter((order) => order.progress === input.progress)
        : summaries,
    };
  }
}

export namespace ListPurchaseOrdersUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    customerId?: string;
    lifecycleStatus?: PurchaseOrder.LifecycleStatus;
    progress?: PurchaseOrder.Progress;
    operationalStatus?: PurchaseOrderOperationalStatus;
    search?: string;
    issuedFrom?: Date;
    issuedTo?: Date;
  };

  export type Output = {
    orders: PurchaseOrderSummaryView[];
  };
}
