import "reflect-metadata";
import { DeleteProductController } from "@application/controllers/products/DeleteProductController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(DeleteProductController);
