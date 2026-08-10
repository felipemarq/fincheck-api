import { Controller } from "@application/contracts/Controller";
import { QuotationView } from "@application/queries/types/QuotationView";
import { GetQuotationUseCase } from "@application/useCases/quotations/GetQuotationUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  QuotationParams,
  quotationParamsSchema,
} from "./schemas/quotationSchemas";

@Injectable()
export class GetQuotationController extends Controller<
  "private",
  GetQuotationController.Response
> {
  constructor(private readonly useCase: GetQuotationUseCase) {
    super();
  }

  protected override async handle({
    params,
    userId,
  }: Controller.Request<"private", Record<string, never>, QuotationParams>) {
    const parsed = quotationParamsSchema.parse(params);
    const quotation = await this.useCase.execute({ ...parsed, userId });
    return { statusCode: 200, body: { quotation } };
  }
}

export namespace GetQuotationController {
  export type Response = { quotation: QuotationView };
}
