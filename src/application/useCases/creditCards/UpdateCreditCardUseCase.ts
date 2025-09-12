import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";
import { CreateCreditCardUseCase } from "./CreateCreditCardUseCase";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { CreditCard } from "@application/entities/CreditCard";

@Injectable()
export class UpdateCreditCardUseCase {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    creditCardInput: UpdateCreditCardUseCase.Input
  ): Promise<UpdateCreditCardUseCase.Output> {
    const transaction = new CreditCard({
      ...creditCardInput,
      createdAt: creditCardInput.createdAt
        ? new Date(creditCardInput.createdAt)
        : undefined,
      updatedAt: creditCardInput.updatedAt
        ? new Date(creditCardInput.updatedAt)
        : undefined,
    });

    const entity = await this.entityRepository.findByUserId({
      userId: creditCardInput.userId,
      entityId: creditCardInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar transações nessa entidade."
      );
    }

    const updatedTransaction = await this.creditCardRepository.update(
      creditCardInput.id,
      transaction
    );

    return updatedTransaction;
  }
}

export namespace UpdateCreditCardUseCase {
  export type Input = CreateCreditCardUseCase.Input & {
    id: string;
    createdAt?: string;
    updatedAt?: string;
  };
  export type Output = CreditCard;
}
