import "reflect-metadata";
import { DeleteQuotationController } from "@application/controllers/quotations/DeleteQuotationController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(DeleteQuotationController);
