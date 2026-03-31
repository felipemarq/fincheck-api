import "reflect-metadata";
import { DeleteAccountController } from "@application/controllers/accounts/DeleteAccountController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(DeleteAccountController);
