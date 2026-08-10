import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { QuotationSummaryView } from "@application/queries/types/QuotationView";
import { ListQuotationsUseCase } from "@application/useCases/quotations/ListQuotationsUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ListQuotationsQuery,
  listQuotationsQuerySchema,
} from "./schemas/quotationSchemas";

@Injectable()
export class ListQuotationsController extends Controller<
  "private",
  ListQuotationsController.Response
> {
  constructor(private readonly useCase: ListQuotationsUseCase) {
    super();
  }

  protected override async handle({
    params,
    queryParams,
    userId,
  }: Controller.Request<
    "private",
    Record<string, never>,
    OrganizationParams,
    ListQuotationsQuery
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listQuotationsQuerySchema.parse(queryParams);
    const quotations = await this.useCase.execute({ ...query, entityId, userId });

    return { statusCode: 200, body: { quotations } };
  }
}

export namespace ListQuotationsController {
  export type Response = { quotations: QuotationSummaryView[] };
}
