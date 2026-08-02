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
export class CreateAcquisitionReceiptUseCase {
  constructor(
    private readonly receiptRepository: AcquisitionReceiptRepository,
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: CreateAcquisitionReceiptUseCase.Input
  ): Promise<AcquisitionReceiptView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [orderRecord, acquisition] = await Promise.all([
      this.purchaseOrderRepository.findOne(input),
      this.acquisitionRepository.findOne(input),
    ]);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (!acquisition) {
      throw new NotFoundException("Aquisicao nao encontrada.");
    }

    if (
      orderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam recebimentos."
      );
    }

    const receipt = new AcquisitionReceipt({
      ...input,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
      items: input.items.map(
        (item) =>
          new AcquisitionReceiptItem({
            ...item,
            entityId: input.entityId,
          })
      ),
    });
    const previous =
      await this.receiptRepository.getReceivedQuantityByAcquisitionItem(
        input
      );

    validateReceipt(receipt, acquisition, previous);

    const created = await this.receiptRepository.create(receipt);
    return toAcquisitionReceiptView(
      created,
      acquisition,
      orderRecord.order.items
    );
  }
}

export namespace CreateAcquisitionReceiptUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    acquisitionId: string;
    receivedAt: Date;
    notes?: string;
    items: Array<{
      acquisitionItemId: string;
      purchaseOrderItemId: string;
      receivedQuantity: number;
      notes?: string;
    }>;
  };
}
