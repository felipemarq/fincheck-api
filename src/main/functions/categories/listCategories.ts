import "reflect-metadata";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ListCategoriesController } from "@application/controllers/categories/ListCategoriesController";

export const handler = lambdaHttpAdapter(ListCategoriesController);
