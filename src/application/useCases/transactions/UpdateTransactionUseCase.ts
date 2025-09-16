import { Account } from "@application/entities/Account";
import { Transaction } from "@application/entities/Transaction";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";
import { CreateTransactionUseCase } from "./CreateTransactionUseCase";

@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    transactionInput: UpdateTransactionUseCase.Input
  ): Promise<UpdateTransactionUseCase.Output> {
    const transaction = new Transaction(transactionInput);

    const entity = await this.entityRepository.findByUserId({
      userId: transactionInput.userId,
      entityId: transactionInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar transações nessa entidade."
      );
    }

    const transactionExists = await this.transactionRepository.findOne({
      transactionId: transactionInput.id,
      userId: transactionInput.userId,
      entityId: transactionInput.entityId,
    });

    if (!transactionExists) {
      throw new UnauthorizedException("Transação não encontrada para editar.");
    }

    const updatedTransaction = await this.transactionRepository.update(
      transactionInput.id,
      transaction
    );

    return updatedTransaction;
  }
}

export namespace UpdateTransactionUseCase {
  export type Input = CreateTransactionUseCase.Input & {
    id: string;
  };
  export type Output = Transaction;
}
