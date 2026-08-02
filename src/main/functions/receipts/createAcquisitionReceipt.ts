import "reflect-metadata";

import { CreateAcquisitionReceiptController } from "@application/controllers/receipts/CreateAcquisitionReceiptController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(
  CreateAcquisitionReceiptController
);
