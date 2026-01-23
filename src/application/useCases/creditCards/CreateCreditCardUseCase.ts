import { CreditCard } from "@application/entities/CreditCard";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateCreditCardUseCase {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    entityId,
    userId,
    accountId,
    name,
    color,
    creditLimit,
    closingDay,
    dueDay,
  }: CreateCreditCardUseCase.Input): Promise<CreateCreditCardUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para criar cartões nessa entidade."
      );
    }

    const creditCard = new CreditCard({
      entityId,
      userId,
      accountId,
      name,
      color,
      creditLimit,
      closingDay,
      dueDay,
    });

    const createdCreditCard = await this.creditCardRepository.create(
      creditCard
    );

    return createdCreditCard;
  }
}

export namespace CreateCreditCardUseCase {
  export type Input = {
    userId: string;
    entityId: string;
    accountId?: string;
    name: string;
    color?: string;
    creditLimit?: number;
    closingDay: number; // 1–28
    dueDay: number; // 1–28
  };

  export type Output = CreditCard;
}
