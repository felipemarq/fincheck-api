import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";
import { PersonalFeature } from "@application/entities/PersonalFeature";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { BodyWeightEntryRepository } from "@infra/database/neon/repositories/BodyWeightEntryRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpsertBodyWeightUseCase {
  constructor(
    private readonly repository: BodyWeightEntryRepository,
    private readonly accessService: PersonalFeatureAccessService
  ) {}

  async execute(input: UpsertBodyWeightUseCase.Input): Promise<BodyWeightEntry> {
    await this.accessService.assertEnabled(
      input.userId,
      PersonalFeature.BODY_WEIGHT
    );

    return this.repository.upsert({
      userId: input.userId,
      measuredOn: input.measuredOn,
      weightGrams: Math.round(input.weightKg * 1_000),
    });
  }
}

export namespace UpsertBodyWeightUseCase {
  export type Input = {
    userId: string;
    measuredOn: string;
    weightKg: number;
  };
}
