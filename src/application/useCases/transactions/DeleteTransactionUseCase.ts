import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    entityId,
    trasactionId,
    userId,
  }: DeleteTransactionUseCase.Input): Promise<DeleteTransactionUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para deletar transações nessa entidade."
      );
    }

    await this.transactionRepository.delete({
      entityId,
      id: trasactionId,
      userId,
    });

    return {
      statusCode: 204,
    };
  }
}

export namespace DeleteTransactionUseCase {
  export type Input = {
    trasactionId: string;
    entityId: string;
    userId: string;
  };
  export type Output = {
    statusCode: number;
  };
}
