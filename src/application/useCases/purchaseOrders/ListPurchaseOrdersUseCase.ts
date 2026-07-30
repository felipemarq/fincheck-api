import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import {
  PurchaseOrderSummaryView,
  toPurchaseOrderSummary,
} from "@application/queries/types/PurchaseOrderView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
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

    const orders = await this.purchaseOrderRepository.listAll(input);
    return { orders: orders.map(toPurchaseOrderSummary) };
  }
}

export namespace ListPurchaseOrdersUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    customerId?: string;
    lifecycleStatus?: PurchaseOrder.LifecycleStatus;
    search?: string;
  };

  export type Output = {
    orders: PurchaseOrderSummaryView[];
  };
}
