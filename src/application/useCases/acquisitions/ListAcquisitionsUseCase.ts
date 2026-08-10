import { Acquisition } from "@application/entities/Acquisition";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { AcquisitionView } from "@application/queries/types/AcquisitionView";
import { AcquisitionViewService } from "@application/services/AcquisitionViewService";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListAcquisitionsUseCase {
  constructor(
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly acquisitionViewService: AcquisitionViewService,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: ListAcquisitionsUseCase.Input
  ): Promise<ListAcquisitionsUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    if (input.purchaseOrderId) {
      const purchaseOrderRecord = await this.purchaseOrderRepository.findOne({
        entityId: input.entityId,
        purchaseOrderId: input.purchaseOrderId,
      });
      if (!purchaseOrderRecord) {
        throw new NotFoundException("Ordem de compra nao encontrada.");
      }
    }

    const acquisitions = await this.acquisitionRepository.listAll(input);

    return {
      acquisitions: await this.acquisitionViewService.build(
        acquisitions,
        input.purchaseOrderId
      ),
    };
  }
}

export namespace ListAcquisitionsUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId?: string;
    search?: string;
    status?: Acquisition.Status;
  };

  export type Output = {
    acquisitions: AcquisitionView[];
  };
}
