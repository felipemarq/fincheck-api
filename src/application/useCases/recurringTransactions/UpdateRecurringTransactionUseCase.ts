import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";
import { CreateRecurringTransactionUseCase } from "./CreateRecurringTransactionUseCase";
import { RecurringTransaction } from "@application/entities/RecurringTransaction";
import { RecurringTransactionRepository } from "@infra/database/neon/repositories/RecurringTransactionRepository";

@Injectable()
export class UpdateRecurringTransactionUseCase {
  constructor(
    private readonly recurringTransactionRepository: RecurringTransactionRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    recurringTransactionInput: UpdateRecurringTransactionUseCase.Input
  ): Promise<UpdateRecurringTransactionUseCase.Output> {
    const recurringTransaction = new RecurringTransaction(
      recurringTransactionInput
    );

    const entity = await this.entityRepository.findByUserId({
      userId: recurringTransactionInput.userId,
      entityId: recurringTransactionInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar transações nessa entidade."
      );
    }

    const updatedTransaction = await this.recurringTransactionRepository.update(
      recurringTransactionInput.id,
      recurringTransaction
    );

    return updatedTransaction;
  }
}

export namespace UpdateRecurringTransactionUseCase {
  export type Input = CreateRecurringTransactionUseCase.Input & {
    id: string;
  };
  export type Output = RecurringTransaction;
}
