import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { CreateAccountController } from "@application/controllers/accounts/CreateAccountController";

const controller = Registry.getInstance().resolve(CreateAccountController);

export const handler = lambdaHttpAdapter(controller);
