import {
  AcquisitionReceipt,
  AcquisitionReceiptItem,
} from "@application/entities/AcquisitionReceipt";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  AcquisitionReceiptView,
  toAcquisitionReceiptView,
} from "@application/queries/types/AcquisitionReceiptView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { validateReceipt } from "@application/services/validateOperations";
import { AcquisitionReceiptRepository } from "@infra/database/neon/repositories/AcquisitionReceiptRepository";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateAcquisitionReceiptUseCase {
  constructor(
    private readonly receiptRepository: AcquisitionReceiptRepository,
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: UpdateAcquisitionReceiptUseCase.Input
  ): Promise<AcquisitionReceiptView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [orderRecord, acquisition, current] = await Promise.all([
      this.purchaseOrderRepository.findOne(input),
      this.acquisitionRepository.findOne(input),
      this.receiptRepository.findOne(input),
    ]);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (!acquisition) {
      throw new NotFoundException("Aquisicao nao encontrada.");
    }

    if (!current) {
      throw new NotFoundException("Recebimento nao encontrado.");
    }

    if (current.isCancelled) {
      throw new BadRequestException(
        "Um recebimento cancelado nao pode ser alterado."
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
            new AcquisitionReceiptItem({
              ...item,
              entityId: input.entityId,
              receiptId: current.id,
            })
        )
      : current.items;
    const updated = new AcquisitionReceipt({
      ...current,
      id: current.id,
      updatedByUserId: input.userId,
      receivedAt: input.receivedAt ?? current.receivedAt,
      status: input.status ?? current.status,
      notes:
        input.notes === null ? undefined : input.notes ?? current.notes,
      items,
      createdAt: current.createdAt,
    });

    if (!updated.isCancelled) {
      const previous =
        await this.receiptRepository.getReceivedQuantityByAcquisitionItem({
          ...input,
          exceptReceiptId: current.id,
        });
      validateReceipt(updated, acquisition, previous);
    }

    this.assertDeliveryQuantitiesRemainValid(
      updated,
      current,
      orderRecord.order
    );

    const saved = await this.receiptRepository.update(updated);
    return toAcquisitionReceiptView(
      saved,
      acquisition,
      orderRecord.order.items
    );
  }

  private assertDeliveryQuantitiesRemainValid(
    updated: AcquisitionReceipt,
    current: AcquisitionReceipt,
    order: PurchaseOrder
  ): void {
    const currentByOrderItem = new Map(
      current.items.map((item) => [
        item.purchaseOrderItemId,
        current.isCancelled ? 0 : item.receivedQuantity,
      ])
    );
    const updatedByOrderItem = new Map(
      updated.items.map((item) => [
        item.purchaseOrderItemId,
        updated.isCancelled ? 0 : item.receivedQuantity,
      ])
    );

    order.items.forEach((orderItem) => {
      const receivedAfterUpdate =
        orderItem.receivedQuantity -
        (currentByOrderItem.get(orderItem.id!) ?? 0) +
        (updatedByOrderItem.get(orderItem.id!) ?? 0);

      if (
        receivedAfterUpdate + 0.0005 <
        orderItem.committedDeliveryQuantity
      ) {
        throw new BadRequestException(
          "O recebimento nao pode ser reduzido abaixo do que ja foi separado para entrega."
        );
      }
    });
  }
}

export namespace UpdateAcquisitionReceiptUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    acquisitionId: string;
    receiptId: string;
    receivedAt?: Date;
    status?: AcquisitionReceipt.Status;
    notes?: string | null;
    items?: Array<{
      id?: string;
      acquisitionItemId: string;
      purchaseOrderItemId: string;
      receivedQuantity: number;
      notes?: string;
    }>;
  };
}
