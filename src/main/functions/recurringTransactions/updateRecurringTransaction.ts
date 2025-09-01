import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { UpdateRecurringTransactionController } from "@application/controllers/recurringTransactions/UpdateRecurringTransactionController";

const controller = Registry.getInstance().resolve(
  UpdateRecurringTransactionController
);

export const handler = lambdaHttpAdapter(controller);
