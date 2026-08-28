import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";
import { PersonalHealthProfile } from "@application/entities/PersonalHealthProfile";
import { Injectable } from "@kernel/decorators/Injectable";

const activityFactors = {
  SEDENTARY_LIGHT: 1.55,
  ACTIVE_MODERATE: 1.75,
  VIGOROUS: 2.2,
} as const;

@Injectable()
export class PersonalEnergyService {
  calculate({
    profile,
    weightEntry,
    onDate,
  }: PersonalEnergyService.Input): PersonalEnergyService.Result {
    const base = {
      onDate,
      weightKg: weightEntry?.weightKg ?? null,
      weightMeasuredOn: weightEntry?.measuredOn ?? null,
      ageYears: null,
      restingEnergyExpenditureKcal: null,
      activityFactor: profile?.activityLevel
        ? activityFactors[profile.activityLevel]
        : null,
      estimatedDailyExpenditureKcal: null,
      effectiveDailyExpenditureKcal:
        profile?.dailyExpenditureOverrideKcal ?? null,
      source: profile?.dailyExpenditureOverrideKcal
        ? ("OVERRIDE" as const)
        : ("UNAVAILABLE" as const),
    };

    if (
      !profile?.birthDate ||
      !profile.heightCm ||
      !profile.calculationSex ||
      !profile.activityLevel ||
      !weightEntry
    ) {
      return base;
    }

    const ageYears = this.calculateAge(profile.birthDate, onDate);
    if (ageYears < 18 || ageYears > 120) return base;

    const sexAdjustment = profile.calculationSex === "MALE" ? 5 : -161;
    const restingEnergyExpenditureKcal = Math.round(
      10 * weightEntry.weightKg +
        6.25 * profile.heightCm -
        5 * ageYears +
        sexAdjustment
    );
    const activityFactor = activityFactors[profile.activityLevel];
    const estimatedDailyExpenditureKcal = Math.round(
      restingEnergyExpenditureKcal * activityFactor
    );

    return {
      ...base,
      ageYears,
      restingEnergyExpenditureKcal,
      activityFactor,
      estimatedDailyExpenditureKcal,
      effectiveDailyExpenditureKcal:
        profile.dailyExpenditureOverrideKcal ??
        estimatedDailyExpenditureKcal,
      source: profile.dailyExpenditureOverrideKcal
        ? "OVERRIDE"
        : "ESTIMATE",
    };
  }

  calculateAge(birthDate: string, onDate: string): number {
    const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
    const [year, month, day] = onDate.split("-").map(Number);
    const beforeBirthday =
      month < birthMonth || (month === birthMonth && day < birthDay);

    return year - birthYear - (beforeBirthday ? 1 : 0);
  }
}

export namespace PersonalEnergyService {
  export type Input = {
    profile: PersonalHealthProfile | null;
    weightEntry: BodyWeightEntry | null;
    onDate: string;
  };

  export type Source = "OVERRIDE" | "ESTIMATE" | "UNAVAILABLE";

  export type Result = {
    onDate: string;
    weightKg: number | null;
    weightMeasuredOn: string | null;
    ageYears: number | null;
    restingEnergyExpenditureKcal: number | null;
    activityFactor: number | null;
    estimatedDailyExpenditureKcal: number | null;
    effectiveDailyExpenditureKcal: number | null;
    source: Source;
  };
}
