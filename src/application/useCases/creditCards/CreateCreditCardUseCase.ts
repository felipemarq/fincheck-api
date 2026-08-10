import { CreditCard } from "@application/entities/CreditCard";
import { ConflictException } from "@application/errors/http/ConflictException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateCreditCardUseCase {
  constructor(
    private readonly repository: CreditCardRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: CreateCreditCardUseCase.Input): Promise<CreditCard> {
    await this.organizationAccessService.assertUserAccess(input.entityId, input.userId);
    const duplicate = await this.repository.findDuplicate(input);
    if (duplicate) {
      throw new ConflictException("Ja existe um cartao deste banco com esse final.");
    }

    return this.repository.create(
      new CreditCard({
        ...input,
        createdByUserId: input.userId,
        updatedByUserId: input.userId,
      })
    );
  }
}

export namespace CreateCreditCardUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    name: string;
    holderName: string;
    bank: string;
    brand: CreditCard.Brand;
    lastFour: string;
    color?: string;
    closingDay: number;
    dueDay: number;
    creditLimit?: number;
    active?: boolean;
  };
}
