import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import {
  ListReceivablesQuery,
  listReceivablesQuerySchema,
} from "@application/controllers/receivables/schemas/receivableSchemas";
import { ReceivablesPage } from "@application/queries/types/ReceivableView";
import { ListReceivablesUseCase } from "@application/useCases/receivables/ListReceivablesUseCase";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListReceivablesController extends Controller<
  "private",
  ReceivablesPage
> {
  constructor(private readonly useCase: ListReceivablesUseCase) {
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
    ListReceivablesQuery
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listReceivablesQuerySchema.parse(queryParams);
    const result = await this.useCase.execute({ entityId, userId, ...query });

    return { statusCode: 200, body: result };
  }
}
