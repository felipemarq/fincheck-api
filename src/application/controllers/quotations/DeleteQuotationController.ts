import { Controller } from "@application/contracts/Controller";
import { DeleteQuotationUseCase } from "@application/useCases/quotations/DeleteQuotationUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  QuotationParams,
  quotationParamsSchema,
} from "./schemas/quotationSchemas";

@Injectable()
export class DeleteQuotationController extends Controller<"private"> {
  constructor(private readonly useCase: DeleteQuotationUseCase) {
    super();
  }

  protected override async handle({
    params,
    userId,
  }: Controller.Request<"private", Record<string, never>, QuotationParams>) {
    const { entityId, quotationId } = quotationParamsSchema.parse(params);
    await this.useCase.execute({ entityId, quotationId, userId });
    return { statusCode: 204 };
  }
}
