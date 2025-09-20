import { Account } from "@application/entities/Account";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class GetBalancesQuery {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository
  ) {}

  async execute({
    entityId,
    userId,
  }: GetBalancesQuery.Input): Promise<GetBalancesQuery.Output> {
    // 1) todas as contas da entidade
    const accounts = await this.accountRepository.listAll({
      entityId,
      userId,
    });

    // 2) agregados de receitas/despesas pagas por conta
    const rows = await this.transactionRepository.getPaidTransactions(
      userId,
      entityId
    );

    const byAcc = new Map<string, { income: number; expense: number }>();
    rows.forEach((r) =>
      byAcc.set(r.accountId, {
        income: Number(r.income),
        expense: Number(r.expense),
      })
    );

    return accounts.map((acc) => {
      const agg = byAcc.get(acc.id!) ?? { income: 0, expense: 0 };
      const ib = Number(acc.initialBalance); // NUMERIC string -> number
      const balance = +(ib + agg.income - agg.expense).toFixed(2);
      return {
        accountId: acc.id,
        name: acc.name,
        type: acc.type,
        color: acc.color,
        balance,
      };
    });
  }
}

export namespace GetBalancesQuery {
  export type Input = { userId: string; entityId: string };
  export type Output = Promise<
    {
      accountId: string | undefined;
      name: string;
      type: Account.Type;
      color: string | undefined;
      balance: number;
    }[]
  >;
}
