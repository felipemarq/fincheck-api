import { Customer } from "@application/entities/Customer";
import { ConflictException } from "@application/errors/http/ConflictException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { normalizeDocument } from "@application/services/normalizeDocument";
import { CustomerRepository } from "@infra/database/neon/repositories/CustomerRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: UpdateCustomerUseCase.Input
  ): Promise<UpdateCustomerUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const current = await this.customerRepository.findOne({
      customerId: input.customerId,
      entityId: input.entityId,
    });

    if (!current) {
      throw new NotFoundException("Cliente nao encontrado.");
    }

    const document = input.document
      ? normalizeDocument(input.document)
      : current.document;
    const duplicate = await this.customerRepository.findByDocument({
      document,
      entityId: input.entityId,
    });

    if (duplicate && duplicate.id !== current.id) {
      throw new ConflictException(
        "Ja existe um cliente com este documento na organizacao."
      );
    }

    return this.customerRepository.update(
      new Customer({
        ...current,
        id: current.id,
        document,
        legalName: input.legalName ?? current.legalName,
        tradeName:
          input.tradeName === null
            ? undefined
            : input.tradeName ?? current.tradeName,
        email:
          input.email === null ? undefined : input.email ?? current.email,
        phone:
          input.phone === null ? undefined : input.phone ?? current.phone,
        billingAddress:
          input.billingAddress === null
            ? undefined
            : input.billingAddress ?? current.billingAddress,
        deliveryAddress:
          input.deliveryAddress === null
            ? undefined
            : input.deliveryAddress ?? current.deliveryAddress,
        notes:
          input.notes === null ? undefined : input.notes ?? current.notes,
        active: input.active ?? current.active,
        updatedByUserId: input.userId,
      })
    );
  }
}

export namespace UpdateCustomerUseCase {
  export type Input = {
    customerId: string;
    entityId: string;
    userId: string;
    legalName?: string;
    tradeName?: string | null;
    document?: string;
    email?: string | null;
    phone?: string | null;
    billingAddress?: string | null;
    deliveryAddress?: string | null;
    notes?: string | null;
    active?: boolean;
  };

  export type Output = Customer;
}
