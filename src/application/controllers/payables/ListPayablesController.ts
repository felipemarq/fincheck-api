import { Controller } from "@application/contracts/Controller";
import { OrganizationParams, organizationParamsSchema } from "@application/controllers/v2Schemas";
import { PayablesResult } from "@application/queries/types/PayableView";
import { ListPayablesUseCase } from "@application/useCases/payables/ListPayablesUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { ListPayablesQuery, listPayablesQuerySchema } from "./schemas/payableSchemas";

@Injectable()
export class ListPayablesController extends Controller<"private", PayablesResult> {
  constructor(private readonly useCase: ListPayablesUseCase) { super(); }
  protected override async handle({ userId, params, queryParams }: Controller.Request<"private", Record<string, never>, OrganizationParams, ListPayablesQuery>) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listPayablesQuerySchema.parse(queryParams);
    const result = await this.useCase.execute({ ...query, entityId, userId });
    return { statusCode: 200, body: result };
  }
}
