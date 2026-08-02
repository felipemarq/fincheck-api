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
export class CreatePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: CreatePurchaseOrderUseCase.Input
  ): Promise<CreatePurchaseOrderUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const customer = await this.customerRepository.findOne({
      customerId: input.customerId,
      entityId: input.entityId,
    });

    if (!customer) {
      throw new NotFoundException("Cliente nao encontrado.");
    }

    if (!customer.active) {
      throw new BadRequestException(
        "Nao e possivel criar uma ordem para um cliente inativo."
      );
    }

    const duplicate = await this.purchaseOrderRepository.findByOrderNumber({
      entityId: input.entityId,
      customerId: input.customerId,
      orderNumber: input.orderNumber,
    });

    if (duplicate) {
      throw new ConflictException(
        "Ja existe uma ordem com este numero para o cliente."
      );
    }

    const products = await Promise.all(
      [...new Set(input.items.map((item) => item.productId))].map(
        (productId) =>
          this.productRepository.findOne({
            entityId: input.entityId,
            productId,
          })
      )
    );
    const productsById = new Map(
      products.filter((product) => product !== null).map((product) => [product.id!, product])
    );

    for (const item of input.items) {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new NotFoundException("Produto nao encontrado.");
      }

      if (!product.active) {
        throw new BadRequestException(
          `O produto "${product.name}" esta inativo e nao pode ser vendido.`
        );
      }
    }

    const order = new PurchaseOrder({
      ...input,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
      billingAddress: input.billingAddress ?? customer.billingAddress,
      deliveryAddress: input.deliveryAddress ?? customer.deliveryAddress,
      items: input.items.map(
        (item) => {
          const product = productsById.get(item.productId)!;

          return (
          new PurchaseOrderItem({
            ...item,
            entityId: input.entityId,
            description: product.name,
            brand: product.brand,
            specification: product.specification,
            originalUnit: product.packaging,
            normalizedUnit: product.normalizedUnit,
          })
          );
        }
      ),
    });

    const created = await this.purchaseOrderRepository.create(order);
    if (created.order.lifecycleStatus === PurchaseOrder.LifecycleStatus.ACTIVE) {
      await this.productRepository.recordSalePrices({
        entityId: input.entityId,
        userId: input.userId,
        soldAt: created.order.issuedAt,
        items: created.order.items.map((item) => ({
          productId: item.productId,
          unitPrice: item.saleUnitPrice,
        })),
      });
    }
    return toPurchaseOrderView(created);
  }
}

export namespace CreatePurchaseOrderUseCase {
  export type ItemInput = {
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
    entityId: string;
    userId: string;
    customerId: string;
    orderNumber: string;
    externalNumber?: string;
    quoteNumber?: string;
    requisitionNumber?: string;
    issuedAt: Date;
    requestedDeliveryAt?: Date;
    officialTotal: number;
    paymentTerms?: string;
    instructions?: string;
    notes?: string;
    billingAddress?: string;
    deliveryAddress?: string;
    lifecycleStatus?: PurchaseOrder.LifecycleStatus;
    items: ItemInput[];
  };

  export type Output = PurchaseOrderView;
}
