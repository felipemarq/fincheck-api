import "reflect-metadata";
import { ListDailyCaloriesController } from "@application/controllers/personalHealth/ListDailyCaloriesController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListDailyCaloriesController);
