import "reflect-metadata";

import { CreateDeliveryController } from "@application/controllers/deliveries/CreateDeliveryController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(CreateDeliveryController);
