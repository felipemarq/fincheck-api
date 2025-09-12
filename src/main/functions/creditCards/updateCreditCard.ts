import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpdateCreditCardController } from "@application/controllers/creditCards/UpdateCreditCardController";

export const handler = lambdaHttpAdapter(UpdateCreditCardController);
