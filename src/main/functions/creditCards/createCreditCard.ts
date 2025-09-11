import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { CreateAccountController } from "@application/controllers/accounts/CreateAccountController";

export const handler = lambdaHttpAdapter(CreateAccountController);
