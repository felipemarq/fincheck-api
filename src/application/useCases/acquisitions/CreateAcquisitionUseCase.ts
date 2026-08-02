import {
  Acquisition,
  AcquisitionItem,
} from "@application/entities/Acquisition";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  AcquisitionView,
  toAcquisitionView,
} from "@application/queries/types/AcquisitionView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { validateAcquisition } from "@application/services/validateAcquisition";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateAcquisitionUseCase {
  constructor(
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: CreateAcquisitionUseCase.Input
  ): Promise<CreateAcquisitionUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const purchaseOrderRecord =
      await this.purchaseOrderRepository.findOne(input);

    if (!purchaseOrderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (
      purchaseOrderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam novas aquisicoes."
      );
    }

    const acquisition = new Acquisition({
      ...input,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
      items: input.items.map(
        (item) =>
          new AcquisitionItem({
            ...item,
            entityId: input.entityId,
          })
      ),
    });

    validateAcquisition(acquisition, purchaseOrderRecord.order);

    const created = await this.acquisitionRepository.create(acquisition);
    if (!created.isCancelled) {
      const orderItemsById = new Map(
        purchaseOrderRecord.order.items.map((item) => [item.id!, item])
      );
      await this.productRepository.recordPurchasePrices({
        entityId: input.entityId,
        userId: input.userId,
        purchasedAt: created.purchasedAt,
        source: created.channel ?? created.sellerName,
        items: created.items.map((item) => ({
          productId: orderItemsById.get(item.purchaseOrderItemId)!.productId,
          unitPrice: item.costUnitPrice,
        })),
      });
    }
    return toAcquisitionView(created, purchaseOrderRecord.order.items);
  }
}

export namespace CreateAcquisitionUseCase {
  export type ItemInput = {
    purchaseOrderItemId: string;
    acquiredQuantity: number;
    costUnitPrice: number;
    lineDiscount?: number;
    notes?: string;
  };

  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    sellerName?: string;
    sellerDocument?: string;
    channel?: string;
    sellerOrderNumber?: string;
    purchasedAt: Date;
    buyerName: string;
    paymentMethod: string;
    paymentInstrument?: string;
    paymentHolder?: string;
    shippingCost?: number;
    generalDiscount?: number;
    otherExpenses?: number;
    status?: Acquisition.Status;
    notes?: string;
    items: ItemInput[];
  };

  export type Output = AcquisitionView;
}
