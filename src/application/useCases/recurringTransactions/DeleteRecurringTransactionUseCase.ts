import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { RecurringTransactionRepository } from "@infra/database/neon/repositories/RecurringTransactionRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteRecurringTransactionUseCase {
  constructor(
    private readonly recurringTransactionRepository: RecurringTransactionRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    entityId,
    recurringTransactionId,
    userId,
  }: DeleteRecurringTransactionUseCase.Input): Promise<DeleteRecurringTransactionUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para deletar transações recorrentes nessa entidade."
      );
    }

    await this.recurringTransactionRepository.delete({
      entityId,
      id: recurringTransactionId,
      userId,
    });

    return {
      statusCode: 204,
    };
  }
}

export namespace DeleteRecurringTransactionUseCase {
  export type Input = {
    recurringTransactionId: string;
    entityId: string;
    userId: string;
  };
  export type Output = {
    statusCode: number;
  };
}
