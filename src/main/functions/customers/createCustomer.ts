import "reflect-metadata";
import { CreateCustomerController } from "@application/controllers/customers/CreateCustomerController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateCustomerController);
