import "reflect-metadata";
import { UpsertPersonalHealthProfileController } from "@application/controllers/personalHealth/UpsertPersonalHealthProfileController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpsertPersonalHealthProfileController);
