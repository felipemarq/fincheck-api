import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { GetDashboardController } from "@application/controllers/dashboard/GetDashboardController";

export const handler = lambdaHttpAdapter(GetDashboardController);
