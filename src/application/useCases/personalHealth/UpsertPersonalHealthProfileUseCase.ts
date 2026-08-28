import { PersonalFeature } from "@application/entities/PersonalFeature";
import {
  ActivityLevel,
  CalculationSex,
  PersonalHealthProfile,
} from "@application/entities/PersonalHealthProfile";
import { PersonalEnergyService } from "@application/services/PersonalEnergyService";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { BodyWeightEntryRepository } from "@infra/database/neon/repositories/BodyWeightEntryRepository";
import { PersonalHealthProfileRepository } from "@infra/database/neon/repositories/PersonalHealthProfileRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpsertPersonalHealthProfileUseCase {
  constructor(
    private readonly profileRepository: PersonalHealthProfileRepository,
    private readonly weightRepository: BodyWeightEntryRepository,
    private readonly energyService: PersonalEnergyService,
    private readonly accessService: PersonalFeatureAccessService
  ) {}

  async execute(
    input: UpsertPersonalHealthProfileUseCase.Input
  ): Promise<UpsertPersonalHealthProfileUseCase.Output> {
    await this.accessService.assertEnabled(
      input.userId,
      PersonalFeature.BODY_WEIGHT
    );

    const profile = await this.profileRepository.upsert({
      userId: input.userId,
      targetWeightGrams:
        input.targetWeightKg === null
          ? null
          : Math.round(input.targetWeightKg * 1_000),
      targetDate: input.targetDate,
      heightCm: input.heightCm,
      birthDate: input.birthDate,
      calculationSex: input.calculationSex,
      activityLevel: input.activityLevel,
      dailyExpenditureOverrideKcal: input.dailyExpenditureOverrideKcal,
    });
    const weightEntry = await this.weightRepository.findLatestOnOrBefore({
      userId: input.userId,
      measuredOn: input.onDate,
    });

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

export namespace UpsertPersonalHealthProfileUseCase {
  export type Input = {
    userId: string;
    onDate: string;
    targetWeightKg: number | null;
    targetDate: string | null;
    heightCm: number | null;
    birthDate: string | null;
    calculationSex: CalculationSex | null;
    activityLevel: ActivityLevel | null;
    dailyExpenditureOverrideKcal: number | null;
  };

  export type Output = {
    profile: PersonalHealthProfile;
    calculation: PersonalEnergyService.Result;
  };
}
