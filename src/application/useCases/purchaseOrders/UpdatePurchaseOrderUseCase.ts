import {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { ConflictException } from "@application/errors/http/ConflictException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  PurchaseOrderView,
  toPurchaseOrderView,
} from "@application/queries/types/PurchaseOrderView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { CustomerRepository } from "@infra/database/neon/repositories/CustomerRepository";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdatePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: UpdatePurchaseOrderUseCase.Input
  ): Promise<UpdatePurchaseOrderUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const currentRecord = await this.purchaseOrderRepository.findOne({
      entityId: input.entityId,
      purchaseOrderId: input.purchaseOrderId,
    });

    if (!currentRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    const current = currentRecord.order;
    const customerId = input.customerId ?? current.customerId;
    const customer = await this.customerRepository.findOne({
      customerId,
      entityId: input.entityId,
    });

    if (!customer) {
      throw new NotFoundException("Cliente nao encontrado.");
    }

    if (!customer.active && customerId !== current.customerId) {
      throw new BadRequestException(
        "Nao e possivel mover a ordem para um cliente inativo."
      );
    }

    const orderNumber = input.orderNumber ?? current.orderNumber;
    const duplicate = await this.purchaseOrderRepository.findByOrderNumber({
      entityId: input.entityId,
      customerId,
      orderNumber,
      exceptPurchaseOrderId: current.id,
    });

    if (duplicate) {
      throw new ConflictException(
        "Ja existe uma ordem com este numero para o cliente."
      );
    }

    if (input.items && current.acquisitionCount > 0) {
      throw new BadRequestException(
        "Os itens da ordem nao podem ser alterados depois do registro de uma aquisicao."
      );
    }

    const customerChanged = customerId !== current.customerId;
    const products = input.items
      ? await Promise.all(
          [...new Set(input.items.map((item) => item.productId))].map(
            (productId) =>
              this.productRepository.findOne({
                entityId: input.entityId,
                productId,
              })
          )
        )
      : [];
    const productsById = new Map(
      products.filter((product) => product !== null).map((product) => [product.id!, product])
    );

    if (input.items) {
      for (const item of input.items) {
        const product = productsById.get(item.productId);
        const wasAlreadySelected = current.items.some(
          (currentItem) => currentItem.productId === item.productId
        );

        if (!product) {
          throw new NotFoundException("Produto nao encontrado.");
        }

        if (!product.active && !wasAlreadySelected) {
          throw new BadRequestException(
            `O produto "${product.name}" esta inativo e nao pode ser vendido.`
          );
        }
      }
    }

    const items = input.items
      ? input.items.map(
          (item) => {
            const product = productsById.get(item.productId)!;

            return (
            new PurchaseOrderItem({
              ...item,
              entityId: input.entityId,
              purchaseOrderId: current.id,
              description: product.name,
              brand: product.brand,
              specification: product.specification,
              originalUnit: product.packaging,
              normalizedUnit: product.normalizedUnit,
            })
            );
          }
        )
      : current.items;

    const updatedOrder = new PurchaseOrder({
      ...current,
      id: current.id,
      entityId: current.entityId,
      customerId,
      orderNumber,
      createdByUserId: current.createdByUserId,
      updatedByUserId: input.userId,
      externalNumber:
        input.externalNumber === null
          ? undefined
          : input.externalNumber ?? current.externalNumber,
      quoteNumber:
        input.quoteNumber === null
          ? undefined
          : input.quoteNumber ?? current.quoteNumber,
      requisitionNumber:
        input.requisitionNumber === null
          ? undefined
          : input.requisitionNumber ?? current.requisitionNumber,
      issuedAt: input.issuedAt ?? current.issuedAt,
      requestedDeliveryAt:
        input.requestedDeliveryAt === null
          ? undefined
          : input.requestedDeliveryAt ?? current.requestedDeliveryAt,
      officialTotal: input.officialTotal ?? current.officialTotal,
      paymentTerms:
        input.paymentTerms === null
          ? undefined
          : input.paymentTerms ?? current.paymentTerms,
      instructions:
        input.instructions === null
          ? undefined
          : input.instructions ?? current.instructions,
      notes:
        input.notes === null ? undefined : input.notes ?? current.notes,
      lifecycleStatus: input.lifecycleStatus ?? current.lifecycleStatus,
      billingAddress:
        input.billingAddress === null
          ? undefined
          : input.billingAddress ??
            (customerChanged
              ? customer.billingAddress
              : current.billingAddress),
      deliveryAddress:
        input.deliveryAddress === null
          ? undefined
          : input.deliveryAddress ??
            (customerChanged
              ? customer.deliveryAddress
              : current.deliveryAddress),
      items,
      createdAt: current.createdAt,
    });

    const updated = await this.purchaseOrderRepository.update(updatedOrder, {
      replaceItems: input.items !== undefined,
    });
    if (updated.order.lifecycleStatus === PurchaseOrder.LifecycleStatus.ACTIVE) {
      await this.productRepository.recordSalePrices({
        entityId: input.entityId,
        userId: input.userId,
        soldAt: updated.order.issuedAt,
        items: updated.order.items.map((item) => ({
          productId: item.productId,
          unitPrice: item.saleUnitPrice,
        })),
      });
    }
    return toPurchaseOrderView(updated);
  }
}

export namespace UpdatePurchaseOrderUseCase {
  export type ItemInput = {
    id?: string;
    productId: string;
    lineNumber: number;
    description: string;
    brand: string;
    specification?: string;
    originalUnit: string;
    normalizedUnit: string;
    orderedQuantity: number;
    saleUnitPrice: number;
    officialTotal: number;
    notes?: string;
  };

  export type Input = {
    purchaseOrderId: string;
    entityId: string;
    userId: string;
    customerId?: string;
    orderNumber?: string;
    externalNumber?: string | null;
    quoteNumber?: string | null;
    requisitionNumber?: string | null;
    issuedAt?: Date;
    requestedDeliveryAt?: Date | null;
    officialTotal?: number;
    paymentTerms?: string | null;
    instructions?: string | null;
    notes?: string | null;
    billingAddress?: string | null;
    deliveryAddress?: string | null;
    lifecycleStatus?: PurchaseOrder.LifecycleStatus;
    items?: ItemInput[];
  };

  export type Output = PurchaseOrderView;
}
