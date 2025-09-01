import { RecurringTransaction } from "@application/entities/RecurringTransaction";
import { Transaction } from "@application/entities/Transaction";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { RecurringTransactionRepository } from "@infra/database/neon/repositories/RecurringTransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateRecurringTransactionUseCase {
  constructor(
    private readonly recurringTransactionRepository: RecurringTransactionRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    recurringTransactionInput: CreateRecurringTransactionUseCase.Input
  ): Promise<CreateRecurringTransactionUseCase.Output> {
    const recurringTransaction = new RecurringTransaction(
      recurringTransactionInput
    );

    const entity = await this.entityRepository.findByUserId({
      userId: recurringTransactionInput.userId,
      entityId: recurringTransactionInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para criar transações nessa entidade."
      );
    }

    const createdTransaction = await this.recurringTransactionRepository.create(
      recurringTransaction
    );

    return createdTransaction;
  }
}

export namespace CreateRecurringTransactionUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    accountId: string;
    categoryId: string;
    creditCardId?: string;
    name: string;
    value: number;
    startDate: Date;
    endDate: Date;
    recurrence: RecurringTransaction.Recurrence;
    type: Transaction.Type;
  };
  export type Output = RecurringTransaction;
}
