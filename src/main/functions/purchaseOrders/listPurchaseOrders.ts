import "reflect-metadata";
import { ListPurchaseOrdersController } from "@application/controllers/purchaseOrders/ListPurchaseOrdersController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListPurchaseOrdersController);
