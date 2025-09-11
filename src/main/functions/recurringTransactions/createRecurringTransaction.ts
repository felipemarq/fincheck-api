import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { CreateRecurringTransactionController } from "@application/controllers/recurringTransactions/CreateRecurringTransactionController";

export const handler = lambdaHttpAdapter(CreateRecurringTransactionController);
