import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";
import { PersonalFeature } from "@application/entities/PersonalFeature";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { BodyWeightEntryRepository } from "@infra/database/neon/repositories/BodyWeightEntryRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListBodyWeightsUseCase {
  constructor(
    private readonly repository: BodyWeightEntryRepository,
    private readonly accessService: PersonalFeatureAccessService
  ) {}

  async execute(input: ListBodyWeightsUseCase.Input): Promise<BodyWeightEntry[]> {
    await this.accessService.assertEnabled(
      input.userId,
      PersonalFeature.BODY_WEIGHT
    );

    return this.repository.list(input);
  }
}

export namespace ListBodyWeightsUseCase {
  export type Input = {
    userId: string;
    from?: string;
    to?: string;
  };
}
