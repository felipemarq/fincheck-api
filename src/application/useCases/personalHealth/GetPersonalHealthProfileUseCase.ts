import { PersonalFeature } from "@application/entities/PersonalFeature";
import { PersonalHealthProfile } from "@application/entities/PersonalHealthProfile";
import { PersonalEnergyService } from "@application/services/PersonalEnergyService";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { BodyWeightEntryRepository } from "@infra/database/neon/repositories/BodyWeightEntryRepository";
import { PersonalHealthProfileRepository } from "@infra/database/neon/repositories/PersonalHealthProfileRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class GetPersonalHealthProfileUseCase {
  constructor(
    private readonly profileRepository: PersonalHealthProfileRepository,
    private readonly weightRepository: BodyWeightEntryRepository,
    private readonly energyService: PersonalEnergyService,
    private readonly accessService: PersonalFeatureAccessService
  ) {}

  async execute(
    input: GetPersonalHealthProfileUseCase.Input
  ): Promise<GetPersonalHealthProfileUseCase.Output> {
    await this.accessService.assertEnabled(
      input.userId,
      PersonalFeature.BODY_WEIGHT
    );

    const [profile, weightEntry] = await Promise.all([
      this.profileRepository.findByUserId(input.userId),
      this.weightRepository.findLatestOnOrBefore({
        userId: input.userId,
        measuredOn: input.onDate,
      }),
    ]);

    return {
      profile,
      calculation: this.energyService.calculate({
        profile,
        weightEntry,
        onDate: input.onDate,
      }),
    };
  }
}

export namespace GetPersonalHealthProfileUseCase {
  export type Input = {
    userId: string;
    onDate: string;
  };

  export type Output = {
    profile: PersonalHealthProfile | null;
    calculation: PersonalEnergyService.Result;
  };
}
