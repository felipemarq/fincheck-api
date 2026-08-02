import { Controller } from "@application/contracts/Controller";
import { Product } from "@application/entities/Product";
import { UpdateProductUseCase } from "@application/useCases/products/UpdateProductUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  ProductParams,
  UpdateProductBody,
  productParamsSchema,
  updateProductSchema,
} from "./schemas/productSchemas";

@Injectable()
@Schema(updateProductSchema)
export class UpdateProductController extends Controller<
  "private",
  UpdateProductController.Response
> {
  constructor(private readonly updateProductUseCase: UpdateProductUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", UpdateProductBody, ProductParams>) {
    const { entityId, productId } = productParamsSchema.parse(params);
    const product = await this.updateProductUseCase.execute({
      ...body,
      entityId,
      productId,
      userId,
    });

    return { statusCode: 200, body: { product } };
  }
}

export namespace UpdateProductController {
  export type Response = { product: Product };
}
