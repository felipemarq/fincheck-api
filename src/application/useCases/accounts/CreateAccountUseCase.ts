import { Account } from "@application/entities/Account";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute({
    entityId,
    initialBalance,
    name,
    type,
    userId,
    color,
  }: CreateAccountUseCase.Input): Promise<CreateAccountUseCase.Output> {
    const account = new Account({
      entityId,
      initialBalance,
      name,
      type,
      userId,
      color,
    });

    const createdAccount = await this.accountRepository.create(account);

    return createdAccount;
  }
}

export namespace CreateAccountUseCase {
  export type Input = {
    userId: string;
    entityId: string;
    name: string;
    initialBalance: number;
    type: Account.Type;
    color?: string;
  };
  export type Output = Account;
}
