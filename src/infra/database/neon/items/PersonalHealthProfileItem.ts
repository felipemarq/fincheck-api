import {
  ActivityLevel,
  CalculationSex,
  PersonalHealthProfile,
} from "@application/entities/PersonalHealthProfile";
import type { PersonalHealthProfileRow } from "../schema";

export class PersonalHealthProfileItem {
  static fromRow(row: PersonalHealthProfileRow): PersonalHealthProfile {
    return new PersonalHealthProfile({
      userId: row.userId,
      targetWeightGrams: row.targetWeightGrams,
      targetDate: row.targetDate,
      heightCm: row.heightCm,
      birthDate: row.birthDate,
      calculationSex: row.calculationSex as CalculationSex | null,
      activityLevel: row.activityLevel as ActivityLevel | null,
      dailyExpenditureOverrideKcal: row.dailyExpenditureOverrideKcal,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
