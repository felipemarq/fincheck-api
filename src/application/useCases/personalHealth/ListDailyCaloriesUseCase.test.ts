import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";
import { DailyCalorieEntry } from "@application/entities/DailyCalorieEntry";
import { PersonalHealthProfile } from "@application/entities/PersonalHealthProfile";
import { PersonalEnergyService } from "@application/services/PersonalEnergyService";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { BodyWeightEntryRepository } from "@infra/database/neon/repositories/BodyWeightEntryRepository";
import { DailyCalorieEntryRepository } from "@infra/database/neon/repositories/DailyCalorieEntryRepository";
import { PersonalHealthProfileRepository } from "@infra/database/neon/repositories/PersonalHealthProfileRepository";
import { ListDailyCaloriesUseCase } from "./ListDailyCaloriesUseCase";

test("soma deficit somente nos dias registrados e calculaveis", async () => {
  const now = new Date("2026-08-27T12:00:00.000Z");
  const calorieRepository = {
    list: async () => [
      new DailyCalorieEntry({
        id: "11111111-1111-4111-8111-111111111111",
        userId: "user-1",
        loggedOn: "2026-08-20",
        caloriesConsumed: 2_000,
        createdAt: now,
        updatedAt: now,
      }),
      new DailyCalorieEntry({
        id: "22222222-2222-4222-8222-222222222222",
        userId: "user-1",
        loggedOn: "2026-08-21",
        caloriesConsumed: 2_200,
        createdAt: now,
        updatedAt: now,
      }),
    ],
  } as unknown as DailyCalorieEntryRepository;
  const profileRepository = {
    findByUserId: async () =>
      new PersonalHealthProfile({
        userId: "user-1",
        targetWeightGrams: null,
        targetDate: null,
        heightCm: 180,
        birthDate: "1990-08-27",
        calculationSex: "MALE",
        activityLevel: "SEDENTARY_LIGHT",
        dailyExpenditureOverrideKcal: null,
        createdAt: now,
        updatedAt: now,
      }),
  } as unknown as PersonalHealthProfileRepository;
  const weightRepository = {
    list: async () => [
      new BodyWeightEntry({
        id: "33333333-3333-4333-8333-333333333333",
        userId: "user-1",
        measuredOn: "2026-08-20",
        weightGrams: 80_000,
        createdAt: now,
        updatedAt: now,
      }),
    ],
  } as unknown as BodyWeightEntryRepository;
  const accessService = {
    assertEnabled: async () => undefined,
  } as unknown as PersonalFeatureAccessService;
  const useCase = new ListDailyCaloriesUseCase(
    calorieRepository,
    profileRepository,
    weightRepository,
    new PersonalEnergyService(),
    accessService
  );

  const result = await useCase.execute({ userId: "user-1" });

  assert.equal(result.entries.length, 2);
  assert.equal(result.summary.loggedDays, 2);
  assert.equal(result.summary.calculableDays, 2);
  assert.equal(result.summary.averageConsumedKcal, 2_100);
  assert.equal(result.summary.totalBalanceKcal, 1_240);
});
