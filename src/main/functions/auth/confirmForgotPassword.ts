import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { Registry } from "@kernel/di/Registry";
import { ConfirmForgotPasswordController } from "@application/controllers/auth/ConfirmForgotPasswordController";

const controller = Registry.getInstance().resolve(
  ConfirmForgotPasswordController
);

export const handler = lambdaHttpAdapter(controller);
