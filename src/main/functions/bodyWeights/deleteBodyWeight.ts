import "reflect-metadata";
import { DeleteBodyWeightController } from "@application/controllers/bodyWeights/DeleteBodyWeightController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(DeleteBodyWeightController);
