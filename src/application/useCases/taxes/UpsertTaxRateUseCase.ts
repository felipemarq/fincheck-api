// src/application/useCases/taxes/UpsertTaxRateUseCase.ts
import { Injectable } from "@kernel/decorators/Injectable";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { TaxRate } from "@application/entities/TaxRate";
import { TaxRateRepository } from "@infra/database/neon/repositories/TaxRateRepository";

@Injectable()
export class UpsertTaxRateUseCase {
  constructor(
    private readonly taxRepository: TaxRateRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    upsertTaxRateInput: UpsertTaxRateUseCase.Input
  ): Promise<UpsertTaxRateUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      entityId: upsertTaxRateInput.entityId,
      userId: upsertTaxRateInput.userId,
    });

    console.log({
      entityId: upsertTaxRateInput.entityId,
      userId: upsertTaxRateInput.userId,
    });

    if (!entity) {
      throw new UnauthorizedException("Sem permissão nesta entidade.");
    }
    const tax = new TaxRate(upsertTaxRateInput);

    const saved = await this.taxRepository.upsert(tax);

    return {
      entityId: saved.entityId,
      userId: saved.userId,
      year: saved.year,
      month: saved.month,
      ratePercent: Number(saved.ratePercent),
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}

export namespace UpsertTaxRateUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    year: number;
    month: number;
    ratePercent: number;
  };

  export type Output = TaxRate;
}
