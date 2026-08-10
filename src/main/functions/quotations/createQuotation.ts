import "reflect-metadata";
import { CreateQuotationController } from "@application/controllers/quotations/CreateQuotationController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateQuotationController);
