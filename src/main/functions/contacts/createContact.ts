import "reflect-metadata";
import { CreateContactController } from "@application/controllers/contacts/CreateContactController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateContactController);
