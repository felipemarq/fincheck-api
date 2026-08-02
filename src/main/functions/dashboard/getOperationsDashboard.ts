import "reflect-metadata";

import { GetOperationsDashboardController } from "@application/controllers/dashboard/GetOperationsDashboardController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(
  GetOperationsDashboardController
);
