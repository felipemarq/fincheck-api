import "reflect-metadata";
import { CreateSupplierPurchaseController } from "@application/controllers/acquisitions/CreateSupplierPurchaseController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateSupplierPurchaseController);
