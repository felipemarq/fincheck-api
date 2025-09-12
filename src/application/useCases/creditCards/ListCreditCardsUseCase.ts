import { ListCreditCardsQuery } from "@application/controllers/creditCards/schemas/listCreditCardsQuerySchema";
import { ListTransactionQuery } from "@application/controllers/transactions/schemas/listTransactionQuerySchema";
import { Account } from "@application/entities/Account";
import { CreditCard } from "@application/entities/CreditCard";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListCreditCardsUseCase {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    listCreditCardInput: ListCreditCardsUseCase.Input
  ): Promise<ListCreditCardsUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId: listCreditCardInput.userId,
      entityId: listCreditCardInput.entityId,
    });

    const creditCards = await this.creditCardRepository.listAll({
      filters: {
        entityId: listCreditCardInput.entityId,
        accountId: listCreditCardInput.accountId,
      },
      userId: listCreditCardInput.userId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar transações nessa entidade."
      );
    }

    return { creditCards };
  }
}

export namespace ListCreditCardsUseCase {
  export type Input = ListCreditCardsQuery & { userId: string };
  export type Output = {
    creditCards: CreditCard[];
  };
}
