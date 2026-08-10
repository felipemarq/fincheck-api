import "reflect-metadata";
import { DeleteQuotationImageController } from "@application/controllers/quotations/DeleteQuotationImageController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(DeleteQuotationImageController);
