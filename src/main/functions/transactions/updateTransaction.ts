import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { UpdateTransactionController } from "@application/controllers/transactions/UpdateTransactionController";

const controller = Registry.getInstance().resolve(UpdateTransactionController);

export const handler = lambdaHttpAdapter(controller);
