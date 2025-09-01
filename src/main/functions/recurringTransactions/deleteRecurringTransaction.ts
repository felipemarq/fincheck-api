import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { DeleteRecurringTransactionController } from "@application/controllers/recurringTransactions/DeleteRecurringTransactionController";

const controller = Registry.getInstance().resolve(
  DeleteRecurringTransactionController
);

export const handler = lambdaHttpAdapter(controller);
