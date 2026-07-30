import { Customer } from "@application/entities/Customer";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { CustomerRepository } from "@infra/database/neon/repositories/CustomerRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListCustomersUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: ListCustomersUseCase.Input
  ): Promise<ListCustomersUseCase.Output> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const customers = await this.customerRepository.listAll(input);
    return { customers };
  }
}

export namespace ListCustomersUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    search?: string;
    active?: boolean;
  };

  export type Output = {
    customers: Customer[];
  };
}
