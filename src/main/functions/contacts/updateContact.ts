import "reflect-metadata";
import { UpdateContactController } from "@application/controllers/contacts/UpdateContactController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateContactController);
