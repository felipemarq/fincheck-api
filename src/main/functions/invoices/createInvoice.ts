import "reflect-metadata";

import { CreateInvoiceController } from "@application/controllers/invoices/CreateInvoiceController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateInvoiceController);
