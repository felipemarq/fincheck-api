import "reflect-metadata";
import { ListContactsController } from "@application/controllers/contacts/ListContactsController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListContactsController);
