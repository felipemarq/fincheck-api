import { DailyCalorieEntry } from "@application/entities/DailyCalorieEntry";
import { PersonalFeature } from "@application/entities/PersonalFeature";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { DailyCalorieEntryRepository } from "@infra/database/neon/repositories/DailyCalorieEntryRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpsertDailyCalorieUseCase {
  constructor(
    private readonly repository: DailyCalorieEntryRepository,
    private readonly accessService: PersonalFeatureAccessService
  ) {}

  async execute(
    input: UpsertDailyCalorieUseCase.Input
  ): Promise<DailyCalorieEntry> {
    await this.accessService.assertEnabled(
      input.userId,
      PersonalFeature.BODY_WEIGHT
    );
    return this.repository.upsert(input);
  }
}

export namespace UpsertDailyCalorieUseCase {
  export type Input = {
    userId: string;
    loggedOn: string;
    caloriesConsumed: number;
  };
}
