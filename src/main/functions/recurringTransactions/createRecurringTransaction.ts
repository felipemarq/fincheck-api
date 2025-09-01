import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { CreateRecurringTransactionController } from "@application/controllers/recurringTransactions/CreateRecurringTransactionController";

const controller = Registry.getInstance().resolve(
  CreateRecurringTransactionController
);

export const handler = lambdaHttpAdapter(controller);
