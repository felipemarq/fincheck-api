import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { ListRecurringTransactionController } from "@application/controllers/recurringTransactions/ListRecurringTransactionController";

const controller = Registry.getInstance().resolve(
  ListRecurringTransactionController
);

export const handler = lambdaHttpAdapter(controller);
