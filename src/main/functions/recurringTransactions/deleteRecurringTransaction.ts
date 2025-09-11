import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { DeleteRecurringTransactionController } from "@application/controllers/recurringTransactions/DeleteRecurringTransactionController";

export const handler = lambdaHttpAdapter(DeleteRecurringTransactionController);
