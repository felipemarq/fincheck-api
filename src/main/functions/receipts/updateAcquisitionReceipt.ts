import "reflect-metadata";

import { UpdateAcquisitionReceiptController } from "@application/controllers/receipts/UpdateAcquisitionReceiptController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(
  UpdateAcquisitionReceiptController
);
