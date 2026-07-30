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
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreatePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly customerRepository: CustomerRepository,
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

    const order = new PurchaseOrder({
      ...input,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
      billingAddress: input.billingAddress ?? customer.billingAddress,
      deliveryAddress: input.deliveryAddress ?? customer.deliveryAddress,
      items: input.items.map(
        (item) =>
          new PurchaseOrderItem({
            ...item,
            entityId: input.entityId,
          })
      ),
    });

    const created = await this.purchaseOrderRepository.create(order);
    return toPurchaseOrderView(created);
  }
}

export namespace CreatePurchaseOrderUseCase {
  export type ItemInput = {
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
