import "reflect-metadata";
import { ListProductsController } from "@application/controllers/products/ListProductsController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListProductsController);
