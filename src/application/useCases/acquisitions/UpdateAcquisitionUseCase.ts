import { Acquisition } from "@application/entities/Acquisition";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { AcquisitionPreparationService } from "@application/services/AcquisitionPreparationService";
import { AcquisitionViewService } from "@application/services/AcquisitionViewService";
import { acquisitionUpdateAffectsPayables } from "@application/services/acquisitionUpdatePolicy";
import { buildPaymentSchedule } from "@application/services/buildPaymentSchedule";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { PaymentConfigurationService } from "@application/services/PaymentConfigurationService";
import { validateAcquisition } from "@application/services/validateAcquisition";
import { AcquisitionReceiptRepository } from "@infra/database/neon/repositories/AcquisitionReceiptRepository";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { PayableRepository } from "@infra/database/neon/repositories/PayableRepository";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateAcquisitionUseCase {
  constructor(
    private readonly acquisitionRepository: AcquisitionRepository,
    private readonly acquisitionReceiptRepository: AcquisitionReceiptRepository,
    private readonly productRepository: ProductRepository,
    private readonly payableRepository: PayableRepository,
    private readonly paymentConfigurationService: PaymentConfigurationService,
    private readonly acquisitionPreparationService: AcquisitionPreparationService,
    private readonly acquisitionViewService: AcquisitionViewService,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: UpdateAcquisitionUseCase.Input
  ): Promise<UpdateAcquisitionUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const current = await this.acquisitionRepository.findOne(input);
    if (!current) {
      throw new NotFoundException("Aquisicao nao encontrada.");
    }
    if (current.isCancelled) {
      throw new BadRequestException(
        "Uma aquisicao cancelada nao pode ser alterada."
      );
    }

    const affectsPayables = acquisitionUpdateAffectsPayables(
      input,
      current.paymentMethod
    );

    if (
      affectsPayables &&
      (current.paymentMethod === Acquisition.PaymentMethod.CREDIT_CARD ||
        current.paymentMethod === Acquisition.PaymentMethod.BOLETO) &&
      (await this.payableRepository.hasPaidForAcquisition({
        entityId: input.entityId,
        acquisitionId: current.id!,
      }))
    ) {
      throw new BadRequestException(
        "Uma compra com parcela paga nao pode ter valores, pagamento ou itens alterados. Dados descritivos ainda podem ser corrigidos."
      );
    }

    if (input.items !== undefined || input.status !== undefined) {
      const hasReceipts =
        await this.acquisitionReceiptRepository.hasConfirmedReceipts({
          entityId: input.entityId,
          acquisitionId: current.id!,
        });
      if (hasReceipts) {
        throw new BadRequestException(
          "Uma aquisicao recebida nao pode ter itens ou situacao alterados."
        );
      }
    }

    const paymentConfigurationChanged =
      input.paymentMethod !== undefined ||
      input.paymentInstrument !== undefined ||
      input.paymentHolder !== undefined ||
      input.creditCardId !== undefined ||
      input.installmentCount !== undefined ||
      input.firstPaymentDueAt !== undefined;

    const [payment, prepared] = await Promise.all([
      paymentConfigurationChanged
        ? this.paymentConfigurationService.normalize({
            entityId: input.entityId,
            paymentMethod: input.paymentMethod ?? current.paymentMethod,
            creditCardId:
              input.creditCardId === null
                ? undefined
                : input.creditCardId ?? current.creditCardId,
            installmentCount:
              input.installmentCount ?? current.installmentCount,
            firstPaymentDueAt:
              input.firstPaymentDueAt === null
                ? undefined
                : input.firstPaymentDueAt ?? current.firstPaymentDueAt,
            paymentInstrument:
              input.paymentInstrument === null
                ? undefined
                : input.paymentInstrument ?? current.paymentInstrument,
            paymentHolder:
              input.paymentHolder === null
                ? undefined
                : input.paymentHolder ?? current.paymentHolder,
          })
        : Promise.resolve({
            creditCardId: current.creditCardId,
            installmentCount: current.installmentCount,
            firstPaymentDueAt: current.firstPaymentDueAt,
            paymentInstrument: current.paymentInstrument,
            paymentHolder: current.paymentHolder,
          }),
      input.items
        ? this.acquisitionPreparationService.prepare({
            entityId: input.entityId,
            purchaseOrderId: input.purchaseOrderId,
            items: input.items,
          })
        : Promise.resolve({
            items: current.items,
            purchaseOrderId: current.purchaseOrderId,
          }),
    ]);

    const updatedAcquisition = new Acquisition({
      ...current,
      id: current.id,
      entityId: current.entityId,
      purchaseOrderId: prepared.purchaseOrderId,
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
        input.channel === null ? undefined : input.channel ?? current.channel,
      sellerOrderNumber:
        input.sellerOrderNumber === null
          ? undefined
          : input.sellerOrderNumber ?? current.sellerOrderNumber,
      purchasedAt: input.purchasedAt ?? current.purchasedAt,
      buyerName: input.buyerName ?? current.buyerName,
      paymentMethod: input.paymentMethod ?? current.paymentMethod,
      ...payment,
      shippingCost: input.shippingCost ?? current.shippingCost,
      generalDiscount: input.generalDiscount ?? current.generalDiscount,
      otherExpenses: input.otherExpenses ?? current.otherExpenses,
      status: input.status ?? current.status,
      notes: input.notes === null ? undefined : input.notes ?? current.notes,
      items: prepared.items,
      createdAt: current.createdAt,
    });

    validateAcquisition(updatedAcquisition);

    const updated = await this.acquisitionRepository.update(
      updatedAcquisition,
      { replaceItems: input.items !== undefined }
    );
    if (affectsPayables) {
      await this.payableRepository.replaceForAcquisition({
        acquisitionId: updated.id!,
        entityId: updated.entityId,
        payables: buildPaymentSchedule(updated),
      });
    } else if (input.sellerName !== undefined) {
      await this.payableRepository.updateDescriptionForAcquisition({
        acquisitionId: updated.id!,
        entityId: updated.entityId,
        description: updated.sellerName
          ? `Compra em ${updated.sellerName}`
          : "Compra operacional",
        updatedByUserId: input.userId,
      });
    }

    const shouldRecordPurchasePrices =
      input.items !== undefined ||
      input.purchasedAt !== undefined ||
      input.channel !== undefined ||
      input.sellerName !== undefined;
    if (!updated.isCancelled && shouldRecordPurchasePrices) {
      await this.productRepository.recordPurchasePrices({
        entityId: input.entityId,
        userId: input.userId,
        purchasedAt: updated.purchasedAt,
        source: updated.channel ?? updated.sellerName,
        items: updated.items.map((item) => ({
          productId: item.productId,
          unitPrice: item.costUnitPrice,
        })),
      });
    }

    return (
      await this.acquisitionViewService.build(
        [updated],
        input.purchaseOrderId
      )
    )[0];
  }
}

export namespace UpdateAcquisitionUseCase {
  export type ItemInput = AcquisitionPreparationService.ItemInput;

  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId?: string;
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
    creditCardId?: string | null;
    installmentCount?: number;
    firstPaymentDueAt?: Date | null;
    shippingCost?: number;
    generalDiscount?: number;
    otherExpenses?: number;
    status?: Acquisition.Status;
    notes?: string | null;
    items?: ItemInput[];
  };

  export type Output = import("@application/queries/types/AcquisitionView").AcquisitionView;
}
