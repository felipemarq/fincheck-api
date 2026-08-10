import "reflect-metadata";
import { ListQuotationsController } from "@application/controllers/quotations/ListQuotationsController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListQuotationsController);
