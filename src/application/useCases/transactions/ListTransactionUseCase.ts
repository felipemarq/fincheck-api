import { ListTransactionQuery } from "@application/controllers/transactions/schemas/listTransactionQuerySchema";
import { Account } from "@application/entities/Account";
import { Transaction } from "@application/entities/Transaction";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    transactionInput: ListTransactionUseCase.Input
  ): Promise<ListTransactionUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId: transactionInput.userId,
      entityId: transactionInput.entityId,
    });

    const result = await this.transactionRepository.listAll({
      filters: {
        ...transactionInput,
        page: transactionInput.page ?? "1",
        pageSize: transactionInput.pageSize ?? "10",
      },
      userId: transactionInput.userId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar transações nessa entidade."
      );
    }

    return result;
  }
}

export namespace ListTransactionUseCase {
  export type Input = ListTransactionQuery & { userId: string };
  export type Output = {
    items: Transaction[];
    total: number;
    page: string | undefined;
    pageSize: number;
    hasNext: boolean;
  };
}
