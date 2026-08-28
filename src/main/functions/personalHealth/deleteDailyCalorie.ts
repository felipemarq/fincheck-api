import "reflect-metadata";
import { DeleteDailyCalorieController } from "@application/controllers/personalHealth/DeleteDailyCalorieController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(DeleteDailyCalorieController);
