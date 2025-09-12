import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpsertTaxRateController } from "@application/controllers/taxes/UpsertTaxRateController";

export const handler = lambdaHttpAdapter(UpsertTaxRateController);
