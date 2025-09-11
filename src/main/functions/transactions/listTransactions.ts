import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ListTransactionController } from "@application/controllers/transactions/ListTransactionController";

export const handler = lambdaHttpAdapter(ListTransactionController);
