import { Controller } from "@application/contracts/Controller";
import {
  PurchaseOrderParams,
  purchaseOrderParamsSchema,
} from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import { DeliveryView } from "@application/queries/types/DeliveryView";
import { CreateDeliveryUseCase } from "@application/useCases/deliveries/CreateDeliveryUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreateDeliveryBody,
  createDeliverySchema,
} from "./schemas/deliverySchemas";

@Injectable()
@Schema(createDeliverySchema)
export class CreateDeliveryController extends Controller<
  "private",
  CreateDeliveryController.Response
> {
  constructor(private readonly useCase: CreateDeliveryUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    CreateDeliveryBody,
    PurchaseOrderParams
  >) {
    const route = purchaseOrderParamsSchema.parse(params);
    const delivery = await this.useCase.execute({
      ...body,
      ...route,
      userId,
    });

    return { statusCode: 201, body: { delivery } };
  }
}

export namespace CreateDeliveryController {
  export type Response = { delivery: DeliveryView };
}
