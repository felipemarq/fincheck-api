import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { CreateTransactionController } from "@application/controllers/transactions/CreateTransactionController";

const controller = Registry.getInstance().resolve(CreateTransactionController);

export const handler = lambdaHttpAdapter(controller);
