import "reflect-metadata";

import { UpdateReceivablePaymentController } from "@application/controllers/invoices/UpdateReceivablePaymentController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(
  UpdateReceivablePaymentController
);
