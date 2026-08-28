import "reflect-metadata";
import { GetPersonalHealthProfileController } from "@application/controllers/personalHealth/GetPersonalHealthProfileController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(GetPersonalHealthProfileController);
