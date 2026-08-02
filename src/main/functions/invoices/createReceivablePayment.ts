import "reflect-metadata";

import { CreateReceivablePaymentController } from "@application/controllers/invoices/CreateReceivablePaymentController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(
  CreateReceivablePaymentController
);
