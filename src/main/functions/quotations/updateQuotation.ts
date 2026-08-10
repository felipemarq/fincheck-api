import "reflect-metadata";
import { UpdateQuotationController } from "@application/controllers/quotations/UpdateQuotationController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateQuotationController);
