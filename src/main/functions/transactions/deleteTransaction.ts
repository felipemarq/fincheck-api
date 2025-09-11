import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { DeleteTransactionController } from "@application/controllers/transactions/DeleteTransactionController";

export const handler = lambdaHttpAdapter(DeleteTransactionController);
