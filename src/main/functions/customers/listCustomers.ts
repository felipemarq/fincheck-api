import "reflect-metadata";
import { ListCustomersController } from "@application/controllers/customers/ListCustomersController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListCustomersController);
