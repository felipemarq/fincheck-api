import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { Customer } from "@application/entities/Customer";
import { ListCustomersUseCase } from "@application/useCases/customers/ListCustomersUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ListCustomersQuery,
  listCustomersQuerySchema,
} from "./schemas/customerSchemas";

@Injectable()
export class ListCustomersController extends Controller<
  "private",
  ListCustomersController.Response
> {
  constructor(private readonly listCustomersUseCase: ListCustomersUseCase) {
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
    ListCustomersQuery
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listCustomersQuerySchema.parse(queryParams);
    const { customers } = await this.listCustomersUseCase.execute({
      ...query,
      entityId,
      userId,
    });

    return {
      statusCode: 200,
      body: { customers },
    };
  }
}

export namespace ListCustomersController {
  export type Response = {
    customers: Customer[];
  };
}
