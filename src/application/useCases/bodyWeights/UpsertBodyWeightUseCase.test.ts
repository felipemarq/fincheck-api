import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";
import { PersonalFeatureAccessService } from "@application/services/PersonalFeatureAccessService";
import { BodyWeightEntryRepository } from "@infra/database/neon/repositories/BodyWeightEntryRepository";
import { UpsertBodyWeightUseCase } from "./UpsertBodyWeightUseCase";

test("converte quilogramas para gramas antes de persistir", async () => {
  let capturedWeightGrams: number | undefined;
  const repository = {
    upsert: async (input: { userId: string; measuredOn: string; weightGrams: number }) => {
      capturedWeightGrams = input.weightGrams;
      return new BodyWeightEntry({
        id: "11111111-1111-4111-8111-111111111111",
        ...input,
        createdAt: new Date("2026-08-27T12:00:00.000Z"),
        updatedAt: new Date("2026-08-27T12:00:00.000Z"),
      });
    },
  } as unknown as BodyWeightEntryRepository;
  const accessService = {
    assertEnabled: async () => undefined,
  } as unknown as PersonalFeatureAccessService;
  const useCase = new UpsertBodyWeightUseCase(repository, accessService);

  const entry = await useCase.execute({
    userId: "user-1",
    measuredOn: "2026-08-27",
    weightKg: 82.375,
  });

  assert.equal(capturedWeightGrams, 82_375);
  assert.equal(entry.weightKg, 82.375);
});
