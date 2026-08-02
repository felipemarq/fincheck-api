import "reflect-metadata";

import { UpdateInvoiceController } from "@application/controllers/invoices/UpdateInvoiceController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateInvoiceController);
