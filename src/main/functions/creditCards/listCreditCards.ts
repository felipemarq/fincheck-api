import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ListCreditCardsController } from "@application/controllers/creditCards/ListCreditCardsController";

export const handler = lambdaHttpAdapter(ListCreditCardsController);
