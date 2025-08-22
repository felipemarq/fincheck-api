import { Account } from "@application/entities/Account";
import { Transaction } from "@application/entities/Transaction";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    transactionInput: CreateTransactionUseCase.Input
  ): Promise<CreateTransactionUseCase.Output> {
    const transaction = new Transaction(transactionInput);

    const entity = await this.entityRepository.findByUserId({
      userId: transactionInput.userId,
      entityId: transactionInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para criar transações nessa entidade."
      );
    }

    const createdTransaction = await this.transactionRepository.create(
      transaction
    );

    return createdTransaction;
  }
}

export namespace CreateTransactionUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    accountId: string;
    categoryId: string;
    creditCardId?: string;
    installmentPurchaseId?: string;
    contactId?: string;
    name: string;
    date: Date;
    dueDate?: Date;
    type: Transaction.Type;
    isPaid: boolean;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
    value: number;
  };
  export type Output = Transaction;
}
