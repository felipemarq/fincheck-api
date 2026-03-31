import { Account } from "@application/entities/Account";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    id,
    entityId,
    userId,
    initialBalance,
    name,
    type,
    color,
  }: UpdateAccountUseCase.Input): Promise<UpdateAccountUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuario nao tem permissao para editar contas nessa entidade."
      );
    }

    const accountExists = await this.accountRepository.findOne({
      accountId: id,
      entityId,
      userId,
    });

    if (!accountExists) {
      throw new UnauthorizedException("Conta nao encontrada para edicao.");
    }

    const account = new Account({
      ...accountExists,
      initialBalance: initialBalance ?? accountExists.initialBalance,
      name: name ?? accountExists.name,
      type: type ?? accountExists.type,
      color: color ?? accountExists.color,
    });

    return this.accountRepository.update(id, account);
  }
}

export namespace UpdateAccountUseCase {
  export type Input = {
    id: string;
    entityId: string;
    userId: string;
    name?: string;
    initialBalance?: number;
    type?: Account.Type;
    color?: string;
  };

  export type Output = Account;
}
