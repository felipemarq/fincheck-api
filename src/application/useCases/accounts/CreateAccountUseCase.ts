import { Account } from "@application/entities/Account";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    entityId,
    initialBalance,
    name,
    type,
    userId,
    color,
  }: CreateAccountUseCase.Input): Promise<CreateAccountUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para criar contas nessa entidade."
      );
    }

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
