import "reflect-metadata";

import { ListAcquisitionReceiptsController } from "@application/controllers/receipts/ListAcquisitionReceiptsController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(
  ListAcquisitionReceiptsController
);
