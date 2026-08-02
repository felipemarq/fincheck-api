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
import { AcquisitionReceiptRepository } from "@infra/database/neon/repositories/AcquisitionReceiptRepository";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateAcquisitionUseCase {
  constructor(
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly acquisitionReceiptRepository: AcquisitionReceiptRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: UpdateAcquisitionUseCase.Input
  ): Promise<UpdateAcquisitionUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const purchaseOrderRecord =
      await this.purchaseOrderRepository.findOne(input);

    if (!purchaseOrderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    const current = await this.acquisitionRepository.findOne(input);

    if (!current) {
      throw new NotFoundException("Aquisicao nao encontrada.");
    }

    if (current.isCancelled) {
      throw new BadRequestException(
        "Uma aquisicao cancelada nao pode ser alterada."
      );
    }

    if (
      purchaseOrderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam alteracoes operacionais."
      );
    }

    const hasReceipts =
      await this.acquisitionReceiptRepository.hasConfirmedReceipts({
        entityId: input.entityId,
        acquisitionId: current.id!,
      });

    if (
      hasReceipts &&
      (input.items !== undefined ||
        input.status === Acquisition.Status.CANCELLED)
    ) {
      throw new BadRequestException(
        "Uma aquisicao recebida nao pode ter itens alterados ou ser cancelada."
      );
    }

    const items = input.items
      ? input.items.map(
          (item) =>
            new AcquisitionItem({
              ...item,
              entityId: input.entityId,
              acquisitionId: current.id,
            })
        )
      : current.items;

    const updatedAcquisition = new Acquisition({
      ...current,
      id: current.id,
      entityId: current.entityId,
      purchaseOrderId: current.purchaseOrderId,
      createdByUserId: current.createdByUserId,
      updatedByUserId: input.userId,
      sellerName:
        input.sellerName === null
          ? undefined
          : input.sellerName ?? current.sellerName,
      sellerDocument:
        input.sellerDocument === null
          ? undefined
          : input.sellerDocument ?? current.sellerDocument,
      channel:
        input.channel === null
          ? undefined
          : input.channel ?? current.channel,
      sellerOrderNumber:
        input.sellerOrderNumber === null
          ? undefined
          : input.sellerOrderNumber ?? current.sellerOrderNumber,
      purchasedAt: input.purchasedAt ?? current.purchasedAt,
      buyerName: input.buyerName ?? current.buyerName,
      paymentMethod: input.paymentMethod ?? current.paymentMethod,
      paymentInstrument:
        input.paymentInstrument === null
          ? undefined
          : input.paymentInstrument ?? current.paymentInstrument,
      paymentHolder:
        input.paymentHolder === null
          ? undefined
          : input.paymentHolder ?? current.paymentHolder,
      shippingCost: input.shippingCost ?? current.shippingCost,
      generalDiscount: input.generalDiscount ?? current.generalDiscount,
      otherExpenses: input.otherExpenses ?? current.otherExpenses,
      status: input.status ?? current.status,
      notes:
        input.notes === null ? undefined : input.notes ?? current.notes,
      items,
      createdAt: current.createdAt,
    });

    validateAcquisition(
      updatedAcquisition,
      purchaseOrderRecord.order
    );

    const updated =
      await this.acquisitionRepository.update(updatedAcquisition);
    if (!updated.isCancelled) {
      const orderItemsById = new Map(
        purchaseOrderRecord.order.items.map((item) => [item.id!, item])
      );
      await this.productRepository.recordPurchasePrices({
        entityId: input.entityId,
        userId: input.userId,
        purchasedAt: updated.purchasedAt,
        source: updated.channel ?? updated.sellerName,
        items: updated.items.map((item) => ({
          productId: orderItemsById.get(item.purchaseOrderItemId)!.productId,
          unitPrice: item.costUnitPrice,
        })),
      });
    }
    return toAcquisitionView(updated, purchaseOrderRecord.order.items);
  }
}

export namespace UpdateAcquisitionUseCase {
  export type ItemInput = {
    id?: string;
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
    acquisitionId: string;
    sellerName?: string | null;
    sellerDocument?: string | null;
    channel?: string | null;
    sellerOrderNumber?: string | null;
    purchasedAt?: Date;
    buyerName?: string;
    paymentMethod?: string;
    paymentInstrument?: string | null;
    paymentHolder?: string | null;
    shippingCost?: number;
    generalDiscount?: number;
    otherExpenses?: number;
    status?: Acquisition.Status;
    notes?: string | null;
    items?: ItemInput[];
  };

  export type Output = AcquisitionView;
}
