import { Account } from "@application/entities/Account";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListAccountsUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute({
    entityId,
    userId,
  }: ListAccountsUseCase.Input): Promise<ListAccountsUseCase.Output> {
    const accounts = await this.accountRepository.listAll({
      entityId,
      userId,
    });

    return accounts;
  }
}

export namespace ListAccountsUseCase {
  export type Input = {
    entityId: string;
    userId: string;
  };
  export type Output = Account[];
}
