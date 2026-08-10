import { Acquisition } from "@application/entities/Acquisition";
import { AcquisitionPreparationService } from "@application/services/AcquisitionPreparationService";
import { AcquisitionViewService } from "@application/services/AcquisitionViewService";
import { buildPaymentSchedule } from "@application/services/buildPaymentSchedule";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { PaymentConfigurationService } from "@application/services/PaymentConfigurationService";
import { validateAcquisition } from "@application/services/validateAcquisition";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { PayableRepository } from "@infra/database/neon/repositories/PayableRepository";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateAcquisitionUseCase {
  constructor(
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly productRepository: ProductRepository,
    private readonly payableRepository: PayableRepository,
    private readonly paymentConfigurationService: PaymentConfigurationService,
    private readonly acquisitionPreparationService: AcquisitionPreparationService,
    private readonly acquisitionViewService: AcquisitionViewService,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: CreateAcquisitionUseCase.Input
  ): Promise<CreateAcquisitionUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [payment, prepared] = await Promise.all([
      this.paymentConfigurationService.normalize(input),
      this.acquisitionPreparationService.prepare(input),
    ]);
    const acquisition = new Acquisition({
      ...input,
      ...payment,
      purchaseOrderId: prepared.purchaseOrderId,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
      items: prepared.items,
    });

    validateAcquisition(acquisition);

    const created = await this.acquisitionRepository.create(acquisition);
    await this.payableRepository.replaceForAcquisition({
      acquisitionId: created.id!,
      entityId: created.entityId,
      payables: buildPaymentSchedule(created),
    });

    if (!created.isCancelled) {
      await this.productRepository.recordPurchasePrices({
        entityId: input.entityId,
        userId: input.userId,
        purchasedAt: created.purchasedAt,
        source: created.channel ?? created.sellerName,
        items: created.items.map((item) => ({
          productId: item.productId,
          unitPrice: item.costUnitPrice,
        })),
      });
    }

    return (
      await this.acquisitionViewService.build(
        [created],
        input.purchaseOrderId
      )
    )[0];
  }
}

export namespace CreateAcquisitionUseCase {
  export type ItemInput = AcquisitionPreparationService.ItemInput;

  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId?: string;
    sellerName?: string;
    sellerDocument?: string;
    channel?: string;
    sellerOrderNumber?: string;
    purchasedAt: Date;
    buyerName: string;
    paymentMethod: string;
    paymentInstrument?: string;
    paymentHolder?: string;
    creditCardId?: string;
    installmentCount?: number;
    firstPaymentDueAt?: Date;
    shippingCost?: number;
    generalDiscount?: number;
    otherExpenses?: number;
    status?: Acquisition.Status;
    notes?: string;
    items: ItemInput[];
  };

  export type Output = import("@application/queries/types/AcquisitionView").AcquisitionView;
}
