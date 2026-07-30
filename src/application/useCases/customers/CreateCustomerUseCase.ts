import { Customer } from "@application/entities/Customer";
import { ConflictException } from "@application/errors/http/ConflictException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { normalizeDocument } from "@application/services/normalizeDocument";
import { CustomerRepository } from "@infra/database/neon/repositories/CustomerRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: CreateCustomerUseCase.Input
  ): Promise<CreateCustomerUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const document = normalizeDocument(input.document);
    const duplicate = await this.customerRepository.findByDocument({
      document,
      entityId: input.entityId,
    });

    if (duplicate) {
      throw new ConflictException(
        "Ja existe um cliente com este documento na organizacao."
      );
    }

    return this.customerRepository.create(
      new Customer({
        ...input,
        document,
        createdByUserId: input.userId,
        updatedByUserId: input.userId,
      })
    );
  }
}

export namespace CreateCustomerUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    legalName: string;
    tradeName?: string;
    document: string;
    email?: string;
    phone?: string;
    billingAddress?: string;
    deliveryAddress?: string;
    notes?: string;
    active?: boolean;
  };

  export type Output = Customer;
}
