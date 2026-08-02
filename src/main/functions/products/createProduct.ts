import "reflect-metadata";
import { CreateProductController } from "@application/controllers/products/CreateProductController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateProductController);
