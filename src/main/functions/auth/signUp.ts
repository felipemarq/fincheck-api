import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { SignUpController } from "@application/controllers/auth/SignUpController";

export const handler = lambdaHttpAdapter(SignUpController);
