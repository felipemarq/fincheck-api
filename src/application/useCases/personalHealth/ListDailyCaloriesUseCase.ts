import { DailyCalorieEntry } from "@application/entities/DailyCalorieEntry";
import { PersonalFeature } from "@application/entities/PersonalFeature";
import { PersonalEnergyService } from "@application/services/PersonalEnergyService";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { BodyWeightEntryRepository } from "@infra/database/neon/repositories/BodyWeightEntryRepository";
import { DailyCalorieEntryRepository } from "@infra/database/neon/repositories/DailyCalorieEntryRepository";
import { PersonalHealthProfileRepository } from "@infra/database/neon/repositories/PersonalHealthProfileRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListDailyCaloriesUseCase {
  constructor(
    private readonly calorieRepository: DailyCalorieEntryRepository,
    private readonly profileRepository: PersonalHealthProfileRepository,
    private readonly weightRepository: BodyWeightEntryRepository,
    private readonly energyService: PersonalEnergyService,
    private readonly accessService: PersonalFeatureAccessService
  ) {}

  async execute(
    input: ListDailyCaloriesUseCase.Input
  ): Promise<ListDailyCaloriesUseCase.Output> {
    await this.accessService.assertEnabled(
      input.userId,
      PersonalFeature.BODY_WEIGHT
    );

    const [entries, profile, weights] = await Promise.all([
      this.calorieRepository.list(input),
      this.profileRepository.findByUserId(input.userId),
      this.weightRepository.list({ userId: input.userId, to: input.to }),
    ]);

    let weightIndex = -1;
    const calculatedEntries = entries.map((entry) => {
      while (
        weightIndex + 1 < weights.length &&
        weights[weightIndex + 1].measuredOn <= entry.loggedOn
      ) {
        weightIndex += 1;
      }

      const calculation = this.energyService.calculate({
        profile,
        weightEntry: weightIndex >= 0 ? weights[weightIndex] : null,
        onDate: entry.loggedOn,
      });
      const balanceKcal =
        calculation.effectiveDailyExpenditureKcal === null
          ? null
          : calculation.effectiveDailyExpenditureKcal -
            entry.caloriesConsumed;

      return { entry, calculation, balanceKcal };
    });

    const totalConsumedKcal = calculatedEntries.reduce(
      (sum, item) => sum + item.entry.caloriesConsumed,
      0
    );
    const calculableEntries = calculatedEntries.filter(
      (item) => item.balanceKcal !== null
    );

    return {
      entries: calculatedEntries,
      summary: {
        loggedDays: entries.length,
        calculableDays: calculableEntries.length,
        totalConsumedKcal,
        averageConsumedKcal:
          entries.length === 0
            ? null
            : Math.round(totalConsumedKcal / entries.length),
        totalBalanceKcal:
          calculableEntries.length === 0
            ? null
            : calculableEntries.reduce(
                (sum, item) => sum + (item.balanceKcal ?? 0),
                0
              ),
      },
    };
  }
}

export namespace ListDailyCaloriesUseCase {
  export type Input = {
    userId: string;
    from?: string;
    to?: string;
  };

  export type CalculatedEntry = {
    entry: DailyCalorieEntry;
    calculation: PersonalEnergyService.Result;
    balanceKcal: number | null;
  };

  export type Output = {
    entries: CalculatedEntry[];
    summary: {
      loggedDays: number;
      calculableDays: number;
      totalConsumedKcal: number;
      averageConsumedKcal: number | null;
      totalBalanceKcal: number | null;
    };
  };
}
