import "reflect-metadata";
import { UpdateCustomerController } from "@application/controllers/customers/UpdateCustomerController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateCustomerController);
