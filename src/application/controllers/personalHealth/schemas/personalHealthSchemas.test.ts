import assert from "node:assert/strict";
import test from "node:test";
import {
  dailyCalorieParamsSchema,
  listDailyCaloriesQuerySchema,
  upsertDailyCalorieSchema,
  upsertPersonalHealthProfileSchema,
} from "./personalHealthSchemas";

test("aceita perfil completo, meta opcional e calorias inteiras", () => {
  const profile = upsertPersonalHealthProfileSchema.parse({
    targetWeightKg: "75.5",
    targetDate: "2027-01-01",
    heightCm: "180",
    birthDate: "1990-08-27",
    calculationSex: "MALE",
    activityLevel: "ACTIVE_MODERATE",
    dailyExpenditureOverrideKcal: null,
  });
  const calories = upsertDailyCalorieSchema.parse({
    caloriesConsumed: "2150",
  });

  assert.equal(profile.targetWeightKg, 75.5);
  assert.equal(profile.heightCm, 180);
  assert.equal(calories.caloriesConsumed, 2_150);
});

test("preenche campos omitidos com null", () => {
  const profile = upsertPersonalHealthProfileSchema.parse({});

  assert.equal(profile.targetWeightKg, null);
  assert.equal(profile.targetDate, null);
  assert.equal(profile.dailyExpenditureOverrideKcal, null);
});

test("rejeita perfil infantil, data invalida e intervalo invertido", () => {
  const currentYear = new Date().getUTCFullYear();
  assert.equal(
    upsertPersonalHealthProfileSchema.safeParse({
      birthDate: `${currentYear - 10}-01-01`,
    }).success,
    false
  );
  assert.equal(
    dailyCalorieParamsSchema.safeParse({ loggedOn: "2026-02-30" }).success,
    false
  );
  assert.equal(
    listDailyCaloriesQuerySchema.safeParse({
      from: "2026-08-20",
      to: "2026-08-01",
    }).success,
    false
  );
  assert.equal(
    upsertDailyCalorieSchema.safeParse({ caloriesConsumed: 2_000.5 }).success,
    false
  );
});
