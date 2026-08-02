import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  AcquisitionView,
  toAcquisitionView,
} from "@application/queries/types/AcquisitionView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListAcquisitionsUseCase {
  constructor(
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: ListAcquisitionsUseCase.Input
  ): Promise<ListAcquisitionsUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const purchaseOrderRecord =
      await this.purchaseOrderRepository.findOne(input);

    if (!purchaseOrderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    const acquisitions = await this.acquisitionRepository.listAll(input);

    return {
      acquisitions: acquisitions.map((acquisition) =>
        toAcquisitionView(acquisition, purchaseOrderRecord.order.items)
      ),
    };
  }
}

export namespace ListAcquisitionsUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
  };

  export type Output = {
    acquisitions: AcquisitionView[];
  };
}
