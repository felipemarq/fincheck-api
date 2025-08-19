import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { CreateBackAccountController } from "@application/controllers/bankAccounts/CreateBackAccountController";

const controller = Registry.getInstance().resolve(CreateBackAccountController);

export const handler = lambdaHttpAdapter(controller);
