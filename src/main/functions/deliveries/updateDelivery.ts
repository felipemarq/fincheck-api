import "reflect-metadata";

import { UpdateDeliveryController } from "@application/controllers/deliveries/UpdateDeliveryController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UpdateDeliveryController);
