import { Controller } from "@application/contracts/Controller";
import { Customer } from "@application/entities/Customer";
import { CreateCustomerUseCase } from "@application/useCases/customers/CreateCustomerUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreateCustomerBody,
  createCustomerSchema,
} from "./schemas/customerSchemas";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";

@Injectable()
@Schema(createCustomerSchema)
export class CreateCustomerController extends Controller<
  "private",
  CreateCustomerController.Response
> {
  constructor(private readonly createCustomerUseCase: CreateCustomerUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", CreateCustomerBody, OrganizationParams>) {
    const { entityId } = organizationParamsSchema.parse(params);
    const customer = await this.createCustomerUseCase.execute({
      ...body,
      entityId,
      userId,
    });

    return {
      statusCode: 201,
      body: { customer },
    };
  }
}

export namespace CreateCustomerController {
  export type Response = {
    customer: Customer;
  };
}
