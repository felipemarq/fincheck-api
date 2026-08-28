import {
  ActivityLevel,
  CalculationSex,
  PersonalHealthProfile,
} from "@application/entities/PersonalHealthProfile";
import { Injectable } from "@kernel/decorators/Injectable";
import { eq } from "drizzle-orm";
import { DatabaseService } from "..";
import { PersonalHealthProfileItem } from "../items/PersonalHealthProfileItem";
import { personalHealthProfilesTable } from "../schema";

@Injectable()
export class PersonalHealthProfileRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByUserId(userId: string): Promise<PersonalHealthProfile | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(personalHealthProfilesTable)
      .where(eq(personalHealthProfilesTable.userId, userId))
      .limit(1);

    return row ? PersonalHealthProfileItem.fromRow(row) : null;
  }

  async upsert(
    input: PersonalHealthProfileRepository.UpsertInput
  ): Promise<PersonalHealthProfile> {
    const profileValues = {
      targetWeightGrams: input.targetWeightGrams,
      targetDate: input.targetDate,
      heightCm: input.heightCm,
      birthDate: input.birthDate,
      calculationSex: input.calculationSex,
      activityLevel: input.activityLevel,
      dailyExpenditureOverrideKcal: input.dailyExpenditureOverrideKcal,
    };
    const [row] = await this.databaseService.db
      .insert(personalHealthProfilesTable)
      .values({ userId: input.userId, ...profileValues })
      .onConflictDoUpdate({
        target: personalHealthProfilesTable.userId,
        set: { ...profileValues, updatedAt: new Date() },
      })
      .returning();

    return PersonalHealthProfileItem.fromRow(row);
  }
}

export namespace PersonalHealthProfileRepository {
  export type UpsertInput = {
    userId: string;
    targetWeightGrams: number | null;
    targetDate: string | null;
    heightCm: number | null;
    birthDate: string | null;
    calculationSex: CalculationSex | null;
    activityLevel: ActivityLevel | null;
    dailyExpenditureOverrideKcal: number | null;
  };
}
