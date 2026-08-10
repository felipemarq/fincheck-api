import "reflect-metadata";
import { CreateCreditCardController } from "@application/controllers/creditCards/CreateCreditCardController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
export const handler = lambdaHttpAdapter(CreateCreditCardController);
