import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ForgotPasswordController } from "@application/controllers/auth/ForgotPasswordController";

export const handler = lambdaHttpAdapter(ForgotPasswordController);
