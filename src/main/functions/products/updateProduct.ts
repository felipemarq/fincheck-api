import "reflect-metadata";
import { UpdateProductController } from "@application/controllers/products/UpdateProductController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateProductController);
