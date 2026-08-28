import "reflect-metadata";
import { ListBodyWeightsController } from "@application/controllers/bodyWeights/ListBodyWeightsController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListBodyWeightsController);
