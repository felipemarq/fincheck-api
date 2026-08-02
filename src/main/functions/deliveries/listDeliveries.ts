import "reflect-metadata";

import { ListDeliveriesController } from "@application/controllers/deliveries/ListDeliveriesController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(ListDeliveriesController);
