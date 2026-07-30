import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { PurchaseOrderSummaryView } from "@application/queries/types/PurchaseOrderView";
import { ListPurchaseOrdersUseCase } from "@application/useCases/purchaseOrders/ListPurchaseOrdersUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ListPurchaseOrdersQuery,
  listPurchaseOrdersQuerySchema,
} from "./schemas/purchaseOrderSchemas";

@Injectable()
export class ListPurchaseOrdersController extends Controller<
  "private",
  ListPurchaseOrdersController.Response
> {
  constructor(
    private readonly listPurchaseOrdersUseCase: ListPurchaseOrdersUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    params,
    queryParams,
  }: Controller.Request<
    "private",
    Record<string, never>,
    OrganizationParams,
    ListPurchaseOrdersQuery
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listPurchaseOrdersQuerySchema.parse(queryParams);
    const { orders } = await this.listPurchaseOrdersUseCase.execute({
      ...query,
      entityId,
      userId,
    });

    return {
      statusCode: 200,
      body: { orders },
    };
  }
}

export namespace ListPurchaseOrdersController {
  export type Response = {
    orders: PurchaseOrderSummaryView[];
  };
}
