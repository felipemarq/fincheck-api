import "reflect-metadata";
import { CreatePurchaseOrderController } from "@application/controllers/purchaseOrders/CreatePurchaseOrderController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreatePurchaseOrderController);
