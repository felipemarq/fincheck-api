import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { PurchaseOrderView } from "@application/queries/types/PurchaseOrderView";
import { CreatePurchaseOrderUseCase } from "@application/useCases/purchaseOrders/CreatePurchaseOrderUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreatePurchaseOrderBody,
  createPurchaseOrderSchema,
} from "./schemas/purchaseOrderSchemas";

@Injectable()
@Schema(createPurchaseOrderSchema)
export class CreatePurchaseOrderController extends Controller<
  "private",
  CreatePurchaseOrderController.Response
> {
  constructor(
    private readonly createPurchaseOrderUseCase: CreatePurchaseOrderUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    CreatePurchaseOrderBody,
    OrganizationParams
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const order = await this.createPurchaseOrderUseCase.execute({
      ...body,
      entityId,
      userId,
    });

    return {
      statusCode: 201,
      body: { order },
    };
  }
}

export namespace CreatePurchaseOrderController {
  export type Response = {
    order: PurchaseOrderView;
  };
}
