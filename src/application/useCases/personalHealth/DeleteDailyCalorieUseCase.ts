import { PersonalFeature } from "@application/entities/PersonalFeature";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { DailyCalorieEntryRepository } from "@infra/database/neon/repositories/DailyCalorieEntryRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteDailyCalorieUseCase {
  constructor(
    private readonly repository: DailyCalorieEntryRepository,
    private readonly accessService: PersonalFeatureAccessService
  ) {}

  async execute(input: DeleteDailyCalorieUseCase.Input): Promise<void> {
    await this.accessService.assertEnabled(
      input.userId,
      PersonalFeature.BODY_WEIGHT
    );
    await this.repository.delete(input);
  }
}

export namespace DeleteDailyCalorieUseCase {
  export type Input = {
    userId: string;
    loggedOn: string;
  };
}
