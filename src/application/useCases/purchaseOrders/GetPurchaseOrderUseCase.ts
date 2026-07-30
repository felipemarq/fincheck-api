import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  PurchaseOrderView,
  toPurchaseOrderView,
} from "@application/queries/types/PurchaseOrderView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class GetPurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: GetPurchaseOrderUseCase.Input
  ): Promise<GetPurchaseOrderUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const purchaseOrder = await this.purchaseOrderRepository.findOne(input);

    if (!purchaseOrder) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    return toPurchaseOrderView(purchaseOrder);
  }
}

export namespace GetPurchaseOrderUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
  };

  export type Output = PurchaseOrderView;
}
