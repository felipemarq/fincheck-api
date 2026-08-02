import "reflect-metadata";

import { ListInvoicesController } from "@application/controllers/invoices/ListInvoicesController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListInvoicesController);
