import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ListAccountsController } from "@application/controllers/accounts/ListAccountsController";

export const handler = lambdaHttpAdapter(ListAccountsController);
