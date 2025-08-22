import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { ListTransactionController } from "@application/controllers/transactions/ListTransactionController";

const controller = Registry.getInstance().resolve(ListTransactionController);

export const handler = lambdaHttpAdapter(controller);
