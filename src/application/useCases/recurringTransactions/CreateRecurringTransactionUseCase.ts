import { RecurringTransaction } from "@application/entities/RecurringTransaction";
import { Transaction } from "@application/entities/Transaction";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { RecurringMaterializer } from "@application/services/RecurringMaterializer";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { RecurringTransactionRepository } from "@infra/database/neon/repositories/RecurringTransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";

@Injectable()
export class CreateRecurringTransactionUseCase {
  constructor(
    private readonly recurringTransactionRepository: RecurringTransactionRepository,
    private readonly entityRepository: EntityRepository,
    private readonly recurringMaterializer: RecurringMaterializer,
    private readonly appConfig: AppConfig
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

    // horizonte inicial – hoje até +horizonDays, respeitando start/end da regra
    const now = new Date();
    const horizonEnd = new Date(
      Date.now() + this.appConfig.recurrence.horizonDays * 24 * 60 * 60 * 1000
    );
    const start =
      createdTransaction.startDate > now
        ? createdTransaction.startDate
        : now;
    const end =
      createdTransaction.endDate && createdTransaction.endDate < horizonEnd
        ? createdTransaction.endDate
        : horizonEnd;

    if (start <= end) {
      await this.recurringMaterializer.materializeWithin(
        createdTransaction,
        start,
        end
      );
    }

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
    contactId?: string;
    name: string;
    value: number;
    startDate: Date;
    endDate?: Date;
    recurrence: RecurringTransaction.Recurrence;
    type: Transaction.Type;
    notes?: string;
  };
  export type Output = RecurringTransaction;
}
