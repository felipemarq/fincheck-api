import { Controller } from "@application/contracts/Controller";
import {
  PurchaseOrderParams,
  purchaseOrderParamsSchema,
} from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import { DeliveryView } from "@application/queries/types/DeliveryView";
import { ListDeliveriesUseCase } from "@application/useCases/deliveries/ListDeliveriesUseCase";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListDeliveriesController extends Controller<
  "private",
  ListDeliveriesController.Response
> {
  constructor(private readonly useCase: ListDeliveriesUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<
    "private",
    Record<string, never>,
    PurchaseOrderParams
  >) {
    const route = purchaseOrderParamsSchema.parse(params);
    const deliveries = await this.useCase.execute({ ...route, userId });

    return { statusCode: 200, body: { deliveries } };
  }
}

export namespace ListDeliveriesController {
  export type Response = { deliveries: DeliveryView[] };
}
