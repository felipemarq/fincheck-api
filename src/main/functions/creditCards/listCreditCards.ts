import "reflect-metadata";
import { ListCreditCardsController } from "@application/controllers/creditCards/ListCreditCardsController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
export const handler = lambdaHttpAdapter(ListCreditCardsController);
