import "reflect-metadata";
import { UpdatePurchaseOrderController } from "@application/controllers/purchaseOrders/UpdatePurchaseOrderController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdatePurchaseOrderController);
