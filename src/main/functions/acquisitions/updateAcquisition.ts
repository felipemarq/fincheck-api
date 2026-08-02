import "reflect-metadata";
import { UpdateAcquisitionController } from "@application/controllers/acquisitions/UpdateAcquisitionController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateAcquisitionController);
