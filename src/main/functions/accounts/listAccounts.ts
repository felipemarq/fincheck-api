import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { ListAccountsController } from "@application/controllers/accounts/ListAccountsController";

const controller = Registry.getInstance().resolve(ListAccountsController);

export const handler = lambdaHttpAdapter(controller);
