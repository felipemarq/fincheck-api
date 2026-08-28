import "reflect-metadata";
import { UpsertDailyCalorieController } from "@application/controllers/personalHealth/UpsertDailyCalorieController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpsertDailyCalorieController);
