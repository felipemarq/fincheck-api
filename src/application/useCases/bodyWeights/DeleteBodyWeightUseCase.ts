import { PersonalFeature } from "@application/entities/PersonalFeature";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { BodyWeightEntryRepository } from "@infra/database/neon/repositories/BodyWeightEntryRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteBodyWeightUseCase {
  constructor(
    private readonly repository: BodyWeightEntryRepository,
    private readonly accessService: PersonalFeatureAccessService
  ) {}

  async execute(input: DeleteBodyWeightUseCase.Input): Promise<void> {
    await this.accessService.assertEnabled(
      input.userId,
      PersonalFeature.BODY_WEIGHT
    );
    await this.repository.delete(input);
  }
}

export namespace DeleteBodyWeightUseCase {
  export type Input = {
    userId: string;
    measuredOn: string;
  };
}
