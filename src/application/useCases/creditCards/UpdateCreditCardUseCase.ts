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
    const entity = await this.entityRepository.findByUserId({
      userId: creditCardInput.userId,
      entityId: creditCardInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar transações nessa entidade."
      );
    }

    const creditCardExists = await this.creditCardRepository.findOne({
      creditCardId: creditCardInput.id,
      entityId: creditCardInput.entityId,
      userId: creditCardInput.userId,
    });

    if (!creditCardExists) {
      throw new UnauthorizedException("Cartão não encontrado para editar.");
    }

    const creditCard = new CreditCard({
      ...creditCardExists,
      ...creditCardInput,
      createdAt: creditCardInput.createdAt
        ? new Date(creditCardInput.createdAt)
        : creditCardExists.createdAt,
      updatedAt: creditCardInput.updatedAt
        ? new Date(creditCardInput.updatedAt)
        : creditCardExists.updatedAt,
    });

    const updatedTransaction = await this.creditCardRepository.update(
      creditCardInput.id,
      creditCard
    );

    return updatedTransaction;
  }
}

export namespace UpdateCreditCardUseCase {
  export type Input = Partial<CreateCreditCardUseCase.Input> & {
    id: string;
    entityId: string;
    userId: string;
    createdAt?: string;
    updatedAt?: string;
  };
  export type Output = CreditCard;
}
