import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { PersonalFeature } from "@application/entities/PersonalFeature";
import { ForbiddenException } from "@application/errors/http/ForbiddenException";
import { UserFeatureRepository } from "@infra/database/neon/repositories/UserFeatureRepository";
import { PersonalFeatureAccessService } from "./PersonalFeatureAccessService";

test("nega acesso quando a feature pessoal nao esta habilitada", async () => {
  const repository = {
    hasFeature: async () => false,
  } as unknown as UserFeatureRepository;
  const service = new PersonalFeatureAccessService(repository);

  await assert.rejects(
    () => service.assertEnabled("user-1", PersonalFeature.BODY_WEIGHT),
    ForbiddenException
  );
});

test("permite acesso quando a feature pessoal esta habilitada", async () => {
  const repository = {
    hasFeature: async () => true,
  } as unknown as UserFeatureRepository;
  const service = new PersonalFeatureAccessService(repository);

  await service.assertEnabled("user-1", PersonalFeature.BODY_WEIGHT);
});
