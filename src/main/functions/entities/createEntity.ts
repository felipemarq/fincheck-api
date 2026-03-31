import "reflect-metadata";
import { CreateEntityController } from "@application/controllers/entities/CreateEntityController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateEntityController);
