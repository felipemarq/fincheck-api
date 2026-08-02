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
export class UpdateDeliveryUseCase {
  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: UpdateDeliveryUseCase.Input
  ): Promise<DeliveryView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [orderRecord, current] = await Promise.all([
      this.purchaseOrderRepository.findOne(input),
      this.deliveryRepository.findOne(input),
    ]);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (!current) {
      throw new NotFoundException("Entrega nao encontrada.");
    }

    if (current.isCancelled) {
      throw new BadRequestException(
        "Uma entrega cancelada nao pode ser alterada."
      );
    }

    if (
      orderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam alteracoes operacionais."
      );
    }

    const items = input.items
      ? input.items.map(
          (item) =>
            new DeliveryItem({
              ...item,
              entityId: input.entityId,
              deliveryId: current.id,
            })
        )
      : current.items;
    const updated = new Delivery({
      ...current,
      id: current.id,
      updatedByUserId: input.userId,
      status: input.status ?? current.status,
      dispatchedAt:
        input.dispatchedAt === null
          ? undefined
          : input.dispatchedAt ?? current.dispatchedAt,
      deliveredAt:
        input.deliveredAt === null
          ? undefined
          : input.deliveredAt ?? current.deliveredAt,
      recipientName: undefined,
      trackingCode: undefined,
      freightCost: input.freightCost ?? current.freightCost,
      notes:
        input.notes === null ? undefined : input.notes ?? current.notes,
      items,
      createdAt: current.createdAt,
    });

    if (!updated.isCancelled) {
      const previous =
        await this.deliveryRepository.getQuantityByOrderItem({
          ...input,
          exceptDeliveryId: current.id,
        });
      validateDelivery(updated, orderRecord.order, previous);
    }

    this.assertInvoiceQuantitiesRemainValid(
      updated,
      current,
      orderRecord.order
    );

    const saved = await this.deliveryRepository.update(updated);
    return toDeliveryView(saved, orderRecord.order.items);
  }

  private assertInvoiceQuantitiesRemainValid(
    updated: Delivery,
    current: Delivery,
    order: PurchaseOrder
  ): void {
    const currentByItem = new Map(
      current.items.map((item) => [
        item.purchaseOrderItemId,
        current.isCancelled ? 0 : item.deliveredQuantity,
      ])
    );
    const updatedByItem = new Map(
      updated.items.map((item) => [
        item.purchaseOrderItemId,
        updated.isCancelled ? 0 : item.deliveredQuantity,
      ])
    );

    order.items.forEach((orderItem) => {
      const committedAfterUpdate =
        orderItem.committedDeliveryQuantity -
        (currentByItem.get(orderItem.id!) ?? 0) +
        (updatedByItem.get(orderItem.id!) ?? 0);

      if (
        committedAfterUpdate + 0.0005 <
        orderItem.invoicedQuantity
      ) {
        throw new BadRequestException(
          "A entrega nao pode ser reduzida abaixo da quantidade ja faturada."
        );
      }
    });
  }
}

export namespace UpdateDeliveryUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    deliveryId: string;
    status?: Delivery.Status;
    dispatchedAt?: Date | null;
    deliveredAt?: Date | null;
    freightCost?: number;
    notes?: string | null;
    items?: Array<{
      id?: string;
      purchaseOrderItemId: string;
      deliveredQuantity: number;
      notes?: string;
    }>;
  };
}
