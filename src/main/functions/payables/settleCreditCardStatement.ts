import "reflect-metadata";
import { SettleCreditCardStatementController } from "@application/controllers/payables/SettleCreditCardStatementController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(SettleCreditCardStatementController);
