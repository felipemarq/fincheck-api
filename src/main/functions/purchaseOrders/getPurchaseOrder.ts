import "reflect-metadata";
import { GetPurchaseOrderController } from "@application/controllers/purchaseOrders/GetPurchaseOrderController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(GetPurchaseOrderController);
