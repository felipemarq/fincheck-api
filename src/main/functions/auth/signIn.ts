import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { SignInController } from "@application/controllers/auth/SignInController";

export const handler = lambdaHttpAdapter(SignInController);
