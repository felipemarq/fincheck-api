import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpdateTransactionController } from "@application/controllers/transactions/UpdateTransactionController";

export const handler = lambdaHttpAdapter(UpdateTransactionController);
