import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { Product } from "@application/entities/Product";
import { CreateProductUseCase } from "@application/useCases/products/CreateProductUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreateProductBody,
  createProductSchema,
} from "./schemas/productSchemas";

@Injectable()
@Schema(createProductSchema)
export class CreateProductController extends Controller<
  "private",
  CreateProductController.Response
> {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", CreateProductBody, OrganizationParams>) {
    const { entityId } = organizationParamsSchema.parse(params);
    const product = await this.createProductUseCase.execute({
      ...body,
      entityId,
      userId,
    });

    return { statusCode: 201, body: { product } };
  }
}

export namespace CreateProductController {
  export type Response = { product: Product };
}
