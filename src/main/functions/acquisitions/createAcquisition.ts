import "reflect-metadata";
import { CreateAcquisitionController } from "@application/controllers/acquisitions/CreateAcquisitionController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateAcquisitionController);
