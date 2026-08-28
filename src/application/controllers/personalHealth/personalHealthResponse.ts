import { DailyCalorieEntry } from "@application/entities/DailyCalorieEntry";
import { PersonalHealthProfile } from "@application/entities/PersonalHealthProfile";
import { PersonalEnergyService } from "@application/services/PersonalEnergyService";
import { ListDailyCaloriesUseCase } from "@application/useCases/personalHealth/ListDailyCaloriesUseCase";

export type PersonalHealthProfileResponse = {
  targetWeightKg: number | null;
  targetDate: string | null;
  heightCm: number | null;
  birthDate: string | null;
  calculationSex: PersonalHealthProfile["calculationSex"];
  activityLevel: PersonalHealthProfile["activityLevel"];
  dailyExpenditureOverrideKcal: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DailyCalorieResponse = {
  id: string;
  loggedOn: string;
  caloriesConsumed: number;
  calculation: PersonalEnergyService.Result;
  balanceKcal: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toPersonalHealthProfileResponse(
  profile: PersonalHealthProfile
): PersonalHealthProfileResponse {
  return {
    targetWeightKg: profile.targetWeightKg,
    targetDate: profile.targetDate,
    heightCm: profile.heightCm,
    birthDate: profile.birthDate,
    calculationSex: profile.calculationSex,
    activityLevel: profile.activityLevel,
    dailyExpenditureOverrideKcal: profile.dailyExpenditureOverrideKcal,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function toDailyCalorieResponse(
  item: ListDailyCaloriesUseCase.CalculatedEntry
): DailyCalorieResponse {
  return {
    id: item.entry.id,
    loggedOn: item.entry.loggedOn,
    caloriesConsumed: item.entry.caloriesConsumed,
    calculation: item.calculation,
    balanceKcal: item.balanceKcal,
    createdAt: item.entry.createdAt,
    updatedAt: item.entry.updatedAt,
  };
}

export function toRawDailyCalorieResponse(entry: DailyCalorieEntry) {
  return {
    id: entry.id,
    loggedOn: entry.loggedOn,
    caloriesConsumed: entry.caloriesConsumed,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
