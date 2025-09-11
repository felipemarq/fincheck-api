import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ConfirmForgotPasswordController } from "@application/controllers/auth/ConfirmForgotPasswordController";

export const handler = lambdaHttpAdapter(ConfirmForgotPasswordController);
