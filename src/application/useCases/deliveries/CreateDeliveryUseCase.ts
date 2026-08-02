import { Delivery, DeliveryItem } from "@application/entities/Delivery";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  DeliveryView,
  toDeliveryView,
} from "@application/queries/types/DeliveryView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { validateDelivery } from "@application/services/validateOperations";
import { DeliveryRepository } from "@infra/database/neon/repositories/DeliveryRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateDeliveryUseCase {
  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: CreateDeliveryUseCase.Input
  ): Promise<DeliveryView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const orderRecord = await this.purchaseOrderRepository.findOne(input);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (
      orderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam entregas."
      );
    }

    const delivery = new Delivery({
      ...input,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
      items: input.items.map(
        (item) =>
          new DeliveryItem({
            ...item,
            entityId: input.entityId,
          })
      ),
    });
    const previous =
      await this.deliveryRepository.getQuantityByOrderItem(input);

    validateDelivery(delivery, orderRecord.order, previous);

    const created = await this.deliveryRepository.create(delivery);
    return toDeliveryView(created, orderRecord.order.items);
  }
}

export namespace CreateDeliveryUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    status?: Delivery.Status;
    dispatchedAt?: Date;
    deliveredAt?: Date;
    freightCost?: number;
    notes?: string;
    items: Array<{
      purchaseOrderItemId: string;
      deliveredQuantity: number;
      notes?: string;
    }>;
  };
}
