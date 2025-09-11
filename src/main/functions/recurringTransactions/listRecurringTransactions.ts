import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ListRecurringTransactionController } from "@application/controllers/recurringTransactions/ListRecurringTransactionController";

export const handler = lambdaHttpAdapter(ListRecurringTransactionController);
