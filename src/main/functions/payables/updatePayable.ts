import "reflect-metadata";
import { UpdatePayableController } from "@application/controllers/payables/UpdatePayableController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
export const handler = lambdaHttpAdapter(UpdatePayableController);
