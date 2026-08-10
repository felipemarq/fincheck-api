import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { PurchaseOrderItemQueuePage } from "@application/queries/types/PurchaseOrderItemQueueView";
import { ListPurchaseOrderItemsUseCase } from "@application/useCases/purchaseOrders/ListPurchaseOrderItemsUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ListPurchaseOrderItemsQuery,
  listPurchaseOrderItemsQuerySchema,
} from "./schemas/purchaseOrderSchemas";

@Injectable()
export class ListPurchaseOrderItemsController extends Controller<
  "private",
  PurchaseOrderItemQueuePage
> {
  constructor(private readonly useCase: ListPurchaseOrderItemsUseCase) {
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
    ListPurchaseOrderItemsQuery
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listPurchaseOrderItemsQuerySchema.parse(queryParams);
    const result = await this.useCase.execute({
      ...query,
      entityId,
      userId,
    });

    return { statusCode: 200, body: result };
  }
}
