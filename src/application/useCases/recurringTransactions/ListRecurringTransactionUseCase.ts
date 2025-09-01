import { ListRecurringTransactionQuery } from "@application/controllers/recurringTransactions/schemas/listRecurringTransactionQuerySchema";
import { Account } from "@application/entities/Account";
import { RecurringTransaction } from "@application/entities/RecurringTransaction";
import { Transaction } from "@application/entities/Transaction";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { RecurringTransactionRepository } from "@infra/database/neon/repositories/RecurringTransactionRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListRecurringTransactionUseCase {
  constructor(
    private readonly recurringTransactionRepository: RecurringTransactionRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    recurringTransactionInput: ListRecurringTransactionUseCase.Input
  ): Promise<ListRecurringTransactionUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId: recurringTransactionInput.userId,
      entityId: recurringTransactionInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para visualizar as  transações recorrentes nessa entidade."
      );
    }

    const result = await this.recurringTransactionRepository.listAll({
      filters: {
        ...recurringTransactionInput,
        page: recurringTransactionInput.page ?? "1",
        pageSize: recurringTransactionInput.pageSize ?? "10",
      },
      userId: recurringTransactionInput.userId,
    });

    return result;
  }
}

export namespace ListRecurringTransactionUseCase {
  export type Input = ListRecurringTransactionQuery & { userId: string };
  export type Output = {
    items: RecurringTransaction[];
    total: number;
    page: string | undefined;
    pageSize: number;
    hasNext: boolean;
  };
}
