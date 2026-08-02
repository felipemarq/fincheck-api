import "reflect-metadata";
import { ListAcquisitionsController } from "@application/controllers/acquisitions/ListAcquisitionsController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListAcquisitionsController);
