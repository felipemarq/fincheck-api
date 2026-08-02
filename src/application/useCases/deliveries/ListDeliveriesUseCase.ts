import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  DeliveryView,
  toDeliveryView,
} from "@application/queries/types/DeliveryView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { DeliveryRepository } from "@infra/database/neon/repositories/DeliveryRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListDeliveriesUseCase {
  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: ListDeliveriesUseCase.Input): Promise<DeliveryView[]> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [orderRecord, deliveries] = await Promise.all([
      this.purchaseOrderRepository.findOne(input),
      this.deliveryRepository.listAll(input),
    ]);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    return deliveries.map((delivery) =>
      toDeliveryView(delivery, orderRecord.order.items)
    );
  }
}

export namespace ListDeliveriesUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
  };
}
