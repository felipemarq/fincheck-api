import { Acquisition } from "@application/entities/Acquisition";
import {
  AcquisitionView,
  toAcquisitionView,
} from "@application/queries/types/AcquisitionView";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class AcquisitionViewService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository
  ) {}

  async build(
    acquisitions: Acquisition[],
    currentPurchaseOrderId?: string
  ): Promise<AcquisitionView[]> {
    const entityId = acquisitions[0]?.entityId;
    if (!entityId) return [];
    const productIds = [
      ...new Set(acquisitions.flatMap((acquisition) => acquisition.items.map((item) => item.productId))),
    ];
    const destinationIds = [
      ...new Set(
        acquisitions.flatMap((acquisition) =>
          acquisition.items.flatMap((item) =>
            item.allocations.map((allocation) => allocation.purchaseOrderItemId)
          )
        )
      ),
    ];
    const [products, destinations] = await Promise.all([
      this.productRepository.findMany({ entityId, productIds }),
      this.purchaseOrderRepository.findItemContexts({
        entityId,
        purchaseOrderItemIds: destinationIds,
      }),
    ]);

    return acquisitions.map((acquisition) =>
      toAcquisitionView(
        acquisition,
        products,
        destinations,
        currentPurchaseOrderId
      )
    );
  }
}
