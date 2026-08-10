import "reflect-metadata";
import { ListPurchaseOrderItemsController } from "@application/controllers/purchaseOrders/ListPurchaseOrderItemsController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListPurchaseOrderItemsController);
