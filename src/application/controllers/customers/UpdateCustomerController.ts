import { Controller } from "@application/contracts/Controller";
import { Customer } from "@application/entities/Customer";
import { UpdateCustomerUseCase } from "@application/useCases/customers/UpdateCustomerUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CustomerParams,
  UpdateCustomerBody,
  customerParamsSchema,
  updateCustomerSchema,
} from "./schemas/customerSchemas";

@Injectable()
@Schema(updateCustomerSchema)
export class UpdateCustomerController extends Controller<
  "private",
  UpdateCustomerController.Response
> {
  constructor(private readonly updateCustomerUseCase: UpdateCustomerUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", UpdateCustomerBody, CustomerParams>) {
    const { entityId, customerId } = customerParamsSchema.parse(params);
    const customer = await this.updateCustomerUseCase.execute({
      ...body,
      entityId,
      customerId,
      userId,
    });

    return {
      statusCode: 200,
      body: { customer },
    };
  }
}

export namespace UpdateCustomerController {
  export type Response = {
    customer: Customer;
  };
}
