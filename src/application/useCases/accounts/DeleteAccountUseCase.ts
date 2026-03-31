import { ConflictException } from "@application/errors/http/ConflictException";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    accountId,
    entityId,
    userId,
  }: DeleteAccountUseCase.Input): Promise<DeleteAccountUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuario nao tem permissao para excluir contas nessa entidade."
      );
    }

    const accountExists = await this.accountRepository.findOne({
      accountId,
      entityId,
      userId,
    });

    if (!accountExists) {
      throw new UnauthorizedException("Conta nao encontrada para exclusao.");
    }

    const usage = await this.accountRepository.getUsageSummary({
      accountId,
      entityId,
      userId,
    });

    if (usage.total > 0) {
      const dependencies = [
        usage.transactionsCount > 0
          ? `${usage.transactionsCount} transacao(oes)`
          : null,
        usage.recurringTransactionsCount > 0
          ? `${usage.recurringTransactionsCount} recorrencia(s)`
          : null,
        usage.installmentPurchasesCount > 0
          ? `${usage.installmentPurchasesCount} compra(s) parcelada(s)`
          : null,
        usage.creditCardsCount > 0
          ? `${usage.creditCardsCount} cartao(oes)`
          : null,
      ]
        .filter(Boolean)
        .join(", ");

      throw new ConflictException(
        `Nao e possivel excluir a conta porque ela ainda possui vinculos em ${dependencies}.`
      );
    }

    await this.accountRepository.delete({
      accountId,
      entityId,
      userId,
    });

    return { statusCode: 204 };
  }
}

export namespace DeleteAccountUseCase {
  export type Input = {
    accountId: string;
    entityId: string;
    userId: string;
  };

  export type Output = {
    statusCode: number;
  };
}
