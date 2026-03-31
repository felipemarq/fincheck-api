import "reflect-metadata";
import { UpdateEntityController } from "@application/controllers/entities/UpdateEntityController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateEntityController);
