import "reflect-metadata";
import { ListPayablesController } from "@application/controllers/payables/ListPayablesController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
export const handler = lambdaHttpAdapter(ListPayablesController);
