import {
  AcquisitionAllocation,
  AcquisitionItem,
} from "@application/entities/Acquisition";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class AcquisitionPreparationService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository
  ) {}

  async prepare({
    entityId,
    purchaseOrderId,
    items,
  }: AcquisitionPreparationService.Input): Promise<AcquisitionPreparationService.Output> {
    const normalized = items.map((item) => ({
      ...item,
      allocations:
        item.allocations ??
        (item.purchaseOrderItemId
          ? [
              {
                purchaseOrderItemId: item.purchaseOrderItemId,
                allocatedQuantity: item.acquiredQuantity,
              },
            ]
          : []),
    }));
    const destinationIds = [
      ...new Set(
        normalized.flatMap((item) =>
          item.allocations.map((allocation) => allocation.purchaseOrderItemId)
        )
      ),
    ];
    const contexts = await this.purchaseOrderRepository.findItemContexts({
      entityId,
      purchaseOrderItemIds: destinationIds,
    });
    if (contexts.length !== destinationIds.length) {
      throw new BadRequestException(
        "Uma ou mais destinacoes nao pertencem a organizacao."
      );
    }

    if (
      contexts.some(
        (context) =>
          context.lifecycleStatus !== PurchaseOrder.LifecycleStatus.ACTIVE
      )
    ) {
      throw new BadRequestException(
        "Somente ordens ativas podem receber produtos de uma compra."
      );
    }

    if (
      purchaseOrderId &&
      !contexts.some((context) => context.purchaseOrderId === purchaseOrderId)
    ) {
      throw new BadRequestException(
        "A compra deve destinar ao menos um produto para a ordem aberta."
      );
    }

    const contextsById = new Map(
      contexts.map((context) => [context.item.id!, context])
    );
    const productIds = normalized.map((item) => {
      const inferredProductId = item.allocations[0]
        ? contextsById.get(item.allocations[0].purchaseOrderItemId)?.item.productId
        : undefined;
      const productId = item.productId ?? inferredProductId;
      if (!productId) {
        throw new BadRequestException(
          "Todo item comprado deve possuir um produto do catalogo."
        );
      }
      return productId;
    });
    const products = await this.productRepository.findMany({
      entityId,
      productIds: [...new Set(productIds)],
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException(
        "Um ou mais produtos da compra nao pertencem a organizacao."
      );
    }

    const preparedItems = normalized.map((item, itemIndex) => {
      const productId = productIds[itemIndex];
      const allocations = item.allocations.map((allocation) => {
        const context = contextsById.get(allocation.purchaseOrderItemId)!;
        if (context.item.productId !== productId) {
          throw new BadRequestException(
            "O produto comprado deve ser o mesmo produto do item destinado."
          );
        }
        return new AcquisitionAllocation({
          ...allocation,
          entityId,
          acquisitionItemId: item.id,
        });
      });

      return new AcquisitionItem({
        ...item,
        entityId,
        productId,
        allocations,
      });
    });

    return {
      items: preparedItems,
      purchaseOrderId:
        purchaseOrderId ?? contexts[0]?.purchaseOrderId,
    };
  }
}

export namespace AcquisitionPreparationService {
  export type AllocationInput = {
    id?: string;
    purchaseOrderItemId: string;
    allocatedQuantity: number;
    notes?: string;
  };

  export type ItemInput = {
    id?: string;
    productId?: string;
    purchaseOrderItemId?: string;
    acquiredQuantity: number;
    costUnitPrice: number;
    lineDiscount?: number;
    notes?: string;
    allocations?: AllocationInput[];
  };

  export type Input = {
    entityId: string;
    purchaseOrderId?: string;
    items: ItemInput[];
  };

  export type Output = {
    purchaseOrderId?: string;
    items: AcquisitionItem[];
  };
}
