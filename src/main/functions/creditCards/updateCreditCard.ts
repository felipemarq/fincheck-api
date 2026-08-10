import "reflect-metadata";
import { UpdateCreditCardController } from "@application/controllers/creditCards/UpdateCreditCardController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
export const handler = lambdaHttpAdapter(UpdateCreditCardController);
