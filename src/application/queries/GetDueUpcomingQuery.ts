import { Account } from "@application/entities/Account";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class GetDueUpcomingQuery {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository
  ) {}

  async execute({
    entityId,
    userId,
    to,
  }: GetDueUpcomingQuery.Input): Promise<GetDueUpcomingQuery.Output> {
    const rows = await this.transactionRepository.getDueUpcoming(
      entityId,
      userId,
      to
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      dueDate: r.dueDate,
      value: +Number(r.value).toFixed(2),
    }));
  }
}

export namespace GetDueUpcomingQuery {
  export type Input = { entityId: string; userId: string; to: Date };
  export type Output = Promise<
    {
      id: string;
      name: string;
      dueDate: Date | null;
      value: number;
    }[]
  >;
}
