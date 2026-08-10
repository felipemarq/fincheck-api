import { Injectable } from "@kernel/decorators/Injectable";
import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { OperationsDashboardView } from "@application/queries/types/OperationsDashboardView";
import { GetOperationsDashboardUseCase } from "@application/useCases/dashboard/GetOperationsDashboardUseCase";
import {
  OperationsDashboardQuery,
  operationsDashboardQuerySchema,
} from "./schemas/dashboardSchemas";

@Injectable()
export class GetOperationsDashboardController extends Controller<
  "private",
  GetOperationsDashboardController.Response
> {
  constructor(private readonly useCase: GetOperationsDashboardUseCase) {
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
    OperationsDashboardQuery
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = operationsDashboardQuerySchema.parse(queryParams);
    const dashboard = await this.useCase.execute({
      ...query,
      entityId,
      userId,
    });

    return { statusCode: 200, body: dashboard };
  }
}

export namespace GetOperationsDashboardController {
  export type Response = OperationsDashboardView;
}
