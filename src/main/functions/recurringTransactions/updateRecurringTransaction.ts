import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpdateRecurringTransactionController } from "@application/controllers/recurringTransactions/UpdateRecurringTransactionController";

export const handler = lambdaHttpAdapter(UpdateRecurringTransactionController);
