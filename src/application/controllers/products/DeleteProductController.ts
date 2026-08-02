import { Controller } from "@application/contracts/Controller";
import { DeleteProductUseCase } from "@application/useCases/products/DeleteProductUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ProductParams,
  productParamsSchema,
} from "./schemas/productSchemas";

@Injectable()
export class DeleteProductController extends Controller<
  "private",
  Record<string, never>
> {
  constructor(private readonly deleteProductUseCase: DeleteProductUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<"private", Record<string, never>, ProductParams>) {
    const { entityId, productId } = productParamsSchema.parse(params);
    await this.deleteProductUseCase.execute({ entityId, productId, userId });

    return { statusCode: 204 };
  }
}
