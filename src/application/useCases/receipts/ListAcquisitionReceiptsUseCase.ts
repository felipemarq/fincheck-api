import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  AcquisitionReceiptView,
  toAcquisitionReceiptView,
} from "@application/queries/types/AcquisitionReceiptView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { AcquisitionReceiptRepository } from "@infra/database/neon/repositories/AcquisitionReceiptRepository";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListAcquisitionReceiptsUseCase {
  constructor(
    private readonly receiptRepository: AcquisitionReceiptRepository,
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: ListAcquisitionReceiptsUseCase.Input
  ): Promise<AcquisitionReceiptView[]> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [orderRecord, acquisition, receipts] = await Promise.all([
      this.purchaseOrderRepository.findOne(input),
      this.acquisitionRepository.findOne(input),
      this.receiptRepository.listAll(input),
    ]);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (!acquisition) {
      throw new NotFoundException("Aquisicao nao encontrada.");
    }

    return receipts.map((receipt) =>
      toAcquisitionReceiptView(
        receipt,
        acquisition,
        orderRecord.order.items
      )
    );
  }
}

export namespace ListAcquisitionReceiptsUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    acquisitionId: string;
  };
}
