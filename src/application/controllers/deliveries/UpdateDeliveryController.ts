import { Controller } from "@application/contracts/Controller";
import { DeliveryView } from "@application/queries/types/DeliveryView";
import { UpdateDeliveryUseCase } from "@application/useCases/deliveries/UpdateDeliveryUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  DeliveryParams,
  UpdateDeliveryBody,
  deliveryParamsSchema,
  updateDeliverySchema,
} from "./schemas/deliverySchemas";

@Injectable()
@Schema(updateDeliverySchema)
export class UpdateDeliveryController extends Controller<
  "private",
  UpdateDeliveryController.Response
> {
  constructor(private readonly useCase: UpdateDeliveryUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", UpdateDeliveryBody, DeliveryParams>) {
    const route = deliveryParamsSchema.parse(params);
    const delivery = await this.useCase.execute({
      ...body,
      ...route,
      userId,
    });

    return { statusCode: 200, body: { delivery } };
  }
}

export namespace UpdateDeliveryController {
  export type Response = { delivery: DeliveryView };
}
