import "reflect-metadata";
import { GetQuotationController } from "@application/controllers/quotations/GetQuotationController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(GetQuotationController);
