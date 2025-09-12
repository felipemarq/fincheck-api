import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { CreateCreditCardController } from "@application/controllers/creditCards/CreateCreditCardController";

export const handler = lambdaHttpAdapter(CreateCreditCardController);
