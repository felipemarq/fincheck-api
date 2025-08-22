import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { DeleteTransactionController } from "@application/controllers/transactions/DeleteTransactionController";

const controller = Registry.getInstance().resolve(DeleteTransactionController);

export const handler = lambdaHttpAdapter(controller);
