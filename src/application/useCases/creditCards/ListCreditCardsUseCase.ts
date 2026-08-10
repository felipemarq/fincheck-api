import { CreditCard } from "@application/entities/CreditCard";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListCreditCardsUseCase {
  constructor(
    private readonly repository: CreditCardRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: ListCreditCardsUseCase.Input): Promise<CreditCard[]> {
    await this.organizationAccessService.assertUserAccess(input.entityId, input.userId);
    return this.repository.listAll(input);
  }
}

export namespace ListCreditCardsUseCase {
  export type Input = { entityId: string; userId: string; active?: boolean };
}
