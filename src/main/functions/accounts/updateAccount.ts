import "reflect-metadata";
import { UpdateAccountController } from "@application/controllers/accounts/UpdateAccountController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateAccountController);
