import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { PayableRepository } from "@infra/database/neon/repositories/PayableRepository";
import { Injectable } from "@kernel/decorators/Injectable";

export function getCreditCardStatementPeriod(year: number, month: number) {
  return {
    dueFrom: new Date(Date.UTC(year, month - 1, 1)),
    dueTo: new Date(Date.UTC(year, month, 1)),
  };
}

@Injectable()
export class SettleCreditCardStatementUseCase {
  constructor(
    private readonly payableRepository: PayableRepository,
    private readonly creditCardRepository: CreditCardRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: SettleCreditCardStatementUseCase.Input
  ): Promise<SettleCreditCardStatementUseCase.Result> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const creditCard = await this.creditCardRepository.findOne(input);
    if (!creditCard) throw new NotFoundException("Cartao nao encontrado.");

    const paidAt = input.paidAt ?? new Date();
    const period = getCreditCardStatementPeriod(input.year, input.month);
    const settlement = await this.payableRepository.settleCreditCardStatement({
      entityId: input.entityId,
      creditCardId: input.creditCardId,
      ...period,
      paidAt,
      updatedByUserId: input.userId,
    });

    if (settlement.settledCount === 0) {
      throw new BadRequestException(
        "Nao existem parcelas em aberto para este cartao no mes informado."
      );
    }

    return {
      creditCardId: input.creditCardId,
      year: input.year,
      month: input.month,
      paidAt,
      ...settlement,
    };
  }
}

export namespace SettleCreditCardStatementUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    creditCardId: string;
    year: number;
    month: number;
    paidAt?: Date;
  };

  export type Result = {
    creditCardId: string;
    year: number;
    month: number;
    paidAt: Date;
    settledCount: number;
    settledAmount: number;
  };
}
