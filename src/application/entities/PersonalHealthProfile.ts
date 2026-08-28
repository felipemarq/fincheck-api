export type CalculationSex = "MALE" | "FEMALE";

export type ActivityLevel =
  | "SEDENTARY_LIGHT"
  | "ACTIVE_MODERATE"
  | "VIGOROUS";

export class PersonalHealthProfile {
  readonly userId: string;
  readonly targetWeightGrams: number | null;
  readonly targetDate: string | null;
  readonly heightCm: number | null;
  readonly birthDate: string | null;
  readonly calculationSex: CalculationSex | null;
  readonly activityLevel: ActivityLevel | null;
  readonly dailyExpenditureOverrideKcal: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(attributes: PersonalHealthProfile.Attributes) {
    this.userId = attributes.userId;
    this.targetWeightGrams = attributes.targetWeightGrams;
    this.targetDate = attributes.targetDate;
    this.heightCm = attributes.heightCm;
    this.birthDate = attributes.birthDate;
    this.calculationSex = attributes.calculationSex;
    this.activityLevel = attributes.activityLevel;
    this.dailyExpenditureOverrideKcal =
      attributes.dailyExpenditureOverrideKcal;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get targetWeightKg(): number | null {
    return this.targetWeightGrams === null
      ? null
      : this.targetWeightGrams / 1_000;
  }
}

export namespace PersonalHealthProfile {
  export type Attributes = {
    userId: string;
    targetWeightGrams: number | null;
    targetDate: string | null;
    heightCm: number | null;
    birthDate: string | null;
    calculationSex: CalculationSex | null;
    activityLevel: ActivityLevel | null;
    dailyExpenditureOverrideKcal: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
}
