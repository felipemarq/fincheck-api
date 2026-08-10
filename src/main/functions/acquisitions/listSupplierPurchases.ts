import "reflect-metadata";
import { ListSupplierPurchasesController } from "@application/controllers/acquisitions/ListSupplierPurchasesController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListSupplierPurchasesController);
