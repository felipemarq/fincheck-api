import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";
import { PersonalHealthProfile } from "@application/entities/PersonalHealthProfile";
import { PersonalEnergyService } from "./PersonalEnergyService";

function makeProfile(
  overrides: Partial<PersonalHealthProfile.Attributes> = {}
): PersonalHealthProfile {
  return new PersonalHealthProfile({
    userId: "user-1",
    targetWeightGrams: 75_000,
    targetDate: "2027-01-01",
    heightCm: 180,
    birthDate: "1990-08-27",
    calculationSex: "MALE",
    activityLevel: "SEDENTARY_LIGHT",
    dailyExpenditureOverrideKcal: null,
    createdAt: new Date("2026-08-27T12:00:00.000Z"),
    updatedAt: new Date("2026-08-27T12:00:00.000Z"),
    ...overrides,
  });
}

function makeWeight(weightGrams = 80_000): BodyWeightEntry {
  return new BodyWeightEntry({
    id: "11111111-1111-4111-8111-111111111111",
    userId: "user-1",
    measuredOn: "2026-08-27",
    weightGrams,
    createdAt: new Date("2026-08-27T12:00:00.000Z"),
    updatedAt: new Date("2026-08-27T12:00:00.000Z"),
  });
}

test("calcula gasto de repouso e diario pela equacao configurada", () => {
  const service = new PersonalEnergyService();
  const result = service.calculate({
    profile: makeProfile(),
    weightEntry: makeWeight(),
    onDate: "2026-08-27",
  });

  assert.equal(result.ageYears, 36);
  assert.equal(result.restingEnergyExpenditureKcal, 1_750);
  assert.equal(result.activityFactor, 1.55);
  assert.equal(result.estimatedDailyExpenditureKcal, 2_713);
  assert.equal(result.effectiveDailyExpenditureKcal, 2_713);
  assert.equal(result.source, "ESTIMATE");
});

test("respeita aniversario e substituicao manual do gasto diario", () => {
  const service = new PersonalEnergyService();
  const result = service.calculate({
    profile: makeProfile({ dailyExpenditureOverrideKcal: 2_400 }),
    weightEntry: makeWeight(),
    onDate: "2026-08-26",
  });

  assert.equal(result.ageYears, 35);
  assert.equal(result.effectiveDailyExpenditureKcal, 2_400);
  assert.equal(result.source, "OVERRIDE");
});

test("mantem calculo indisponivel sem dados suficientes", () => {
  const service = new PersonalEnergyService();
  const result = service.calculate({
    profile: makeProfile({ heightCm: null }),
    weightEntry: makeWeight(),
    onDate: "2026-08-27",
  });

  assert.equal(result.restingEnergyExpenditureKcal, null);
  assert.equal(result.effectiveDailyExpenditureKcal, null);
  assert.equal(result.source, "UNAVAILABLE");
});
