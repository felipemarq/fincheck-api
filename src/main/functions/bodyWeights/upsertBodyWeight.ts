import "reflect-metadata";
import { UpsertBodyWeightController } from "@application/controllers/bodyWeights/UpsertBodyWeightController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpsertBodyWeightController);
