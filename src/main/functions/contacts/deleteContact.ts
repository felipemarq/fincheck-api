import "reflect-metadata";
import { DeleteContactController } from "@application/controllers/contacts/DeleteContactController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(DeleteContactController);
