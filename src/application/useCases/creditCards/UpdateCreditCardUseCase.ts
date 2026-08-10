import { CreditCard } from "@application/entities/CreditCard";
import { ConflictException } from "@application/errors/http/ConflictException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateCreditCardUseCase {
  constructor(
    private readonly repository: CreditCardRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: UpdateCreditCardUseCase.Input): Promise<CreditCard> {
    await this.organizationAccessService.assertUserAccess(input.entityId, input.userId);
    const current = await this.repository.findOne(input);
    if (!current) throw new NotFoundException("Cartao nao encontrado.");

    const bank = input.bank ?? current.bank;
    const lastFour = input.lastFour ?? current.lastFour;
    const duplicate = await this.repository.findDuplicate({ entityId: input.entityId, bank, lastFour });
    if (duplicate && duplicate.id !== current.id) {
      throw new ConflictException("Ja existe um cartao deste banco com esse final.");
    }

    return this.repository.update(
      new CreditCard({
        ...current,
        ...input,
        id: current.id,
        entityId: current.entityId,
        createdByUserId: current.createdByUserId,
        updatedByUserId: input.userId,
        creditLimit: input.creditLimit === null ? undefined : input.creditLimit ?? current.creditLimit,
      })
    );
  }
}

export namespace UpdateCreditCardUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    creditCardId: string;
    name?: string;
    holderName?: string;
    bank?: string;
    brand?: CreditCard.Brand;
    lastFour?: string;
    color?: string;
    closingDay?: number;
    dueDay?: number;
    creditLimit?: number | null;
    active?: boolean;
  };
}
