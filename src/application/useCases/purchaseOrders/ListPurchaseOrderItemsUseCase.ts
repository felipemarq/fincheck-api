import {
  PurchaseOrderItemDeadlineFilter,
  PurchaseOrderItemProcurementStatus,
  PurchaseOrderItemQueuePage,
  PurchaseOrderItemSort,
} from "@application/queries/types/PurchaseOrderItemQueueView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListPurchaseOrderItemsUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: ListPurchaseOrderItemsUseCase.Input
  ): Promise<PurchaseOrderItemQueuePage> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    return this.purchaseOrderRepository.listOperationalItems(input);
  }
}

export namespace ListPurchaseOrderItemsUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderItemId?: string;
    search?: string;
    customerId?: string;
    status?: PurchaseOrderItemProcurementStatus;
    deadline?: PurchaseOrderItemDeadlineFilter;
    sort: PurchaseOrderItemSort;
    page: number;
    pageSize: number;
  };
}
