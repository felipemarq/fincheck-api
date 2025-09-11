import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { CreateTransactionController } from "@application/controllers/transactions/CreateTransactionController";

export const handler = lambdaHttpAdapter(CreateTransactionController);
