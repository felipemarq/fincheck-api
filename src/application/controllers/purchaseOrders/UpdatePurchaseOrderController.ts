import { Controller } from "@application/contracts/Controller";
import { PurchaseOrderView } from "@application/queries/types/PurchaseOrderView";
import { UpdatePurchaseOrderUseCase } from "@application/useCases/purchaseOrders/UpdatePurchaseOrderUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  PurchaseOrderParams,
  UpdatePurchaseOrderBody,
  purchaseOrderParamsSchema,
  updatePurchaseOrderSchema,
} from "./schemas/purchaseOrderSchemas";

@Injectable()
@Schema(updatePurchaseOrderSchema)
export class UpdatePurchaseOrderController extends Controller<
  "private",
  UpdatePurchaseOrderController.Response
> {
  constructor(
    private readonly updatePurchaseOrderUseCase: UpdatePurchaseOrderUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    UpdatePurchaseOrderBody,
    PurchaseOrderParams
  >) {
    const { entityId, purchaseOrderId } =
      purchaseOrderParamsSchema.parse(params);
    const order = await this.updatePurchaseOrderUseCase.execute({
      ...body,
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

export namespace UpdatePurchaseOrderController {
  export type Response = {
    order: PurchaseOrderView;
  };
}
