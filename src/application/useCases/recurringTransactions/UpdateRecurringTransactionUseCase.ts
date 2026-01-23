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
    const entity = await this.entityRepository.findByUserId({
      userId: recurringTransactionInput.userId,
      entityId: recurringTransactionInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar transações nessa entidade."
      );
    }

    const recurringTransactionExists =
      await this.recurringTransactionRepository.findOne({
        recurringTransactionId: recurringTransactionInput.id,
        entityId: recurringTransactionInput.entityId,
        userId: recurringTransactionInput.userId,
      });

    if (!recurringTransactionExists) {
      throw new UnauthorizedException(
        "Transação recorrente não encontrada para editar."
      );
    }

    const recurringTransaction = new RecurringTransaction({
      ...recurringTransactionExists,
      ...recurringTransactionInput,
    });

    const updatedTransaction = await this.recurringTransactionRepository.update(
      recurringTransactionInput.id,
      recurringTransaction
    );

    return updatedTransaction;
  }
}

export namespace UpdateRecurringTransactionUseCase {
  export type Input = Partial<CreateRecurringTransactionUseCase.Input> & {
    id: string;
    entityId: string;
    userId: string;
  };
  export type Output = RecurringTransaction;
}
