import { Controller } from "@application/contracts/Controller";
import { PurchaseOrderView } from "@application/queries/types/PurchaseOrderView";
import { GetPurchaseOrderUseCase } from "@application/useCases/purchaseOrders/GetPurchaseOrderUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  PurchaseOrderParams,
  purchaseOrderParamsSchema,
} from "./schemas/purchaseOrderSchemas";

@Injectable()
export class GetPurchaseOrderController extends Controller<
  "private",
  GetPurchaseOrderController.Response
> {
  constructor(
    private readonly getPurchaseOrderUseCase: GetPurchaseOrderUseCase
  ) {
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
    const { entityId, purchaseOrderId } =
      purchaseOrderParamsSchema.parse(params);
    const order = await this.getPurchaseOrderUseCase.execute({
      entityId,
      purchaseOrderId,
      userId,
    });

    return {
      statusCode: 200,
      body: { order },
    };
  }
}

export namespace GetPurchaseOrderController {
  export type Response = {
    order: PurchaseOrderView;
  };
}
