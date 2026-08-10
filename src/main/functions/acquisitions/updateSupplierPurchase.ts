import "reflect-metadata";
import { UpdateSupplierPurchaseController } from "@application/controllers/acquisitions/UpdateSupplierPurchaseController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateSupplierPurchaseController);
