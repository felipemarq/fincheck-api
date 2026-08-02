import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { Product } from "@application/entities/Product";
import { ListProductsUseCase } from "@application/useCases/products/ListProductsUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ListProductsQuery,
  listProductsQuerySchema,
} from "./schemas/productSchemas";

@Injectable()
export class ListProductsController extends Controller<
  "private",
  ListProductsController.Response
> {
  constructor(private readonly listProductsUseCase: ListProductsUseCase) {
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
    ListProductsQuery
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listProductsQuerySchema.parse(queryParams);
    const { products } = await this.listProductsUseCase.execute({
      ...query,
      entityId,
      userId,
    });

    return { statusCode: 200, body: { products } };
  }
}

export namespace ListProductsController {
  export type Response = { products: Product[] };
}
