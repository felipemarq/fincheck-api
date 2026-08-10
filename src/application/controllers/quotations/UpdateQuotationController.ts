import { Controller } from "@application/contracts/Controller";
import { QuotationView } from "@application/queries/types/QuotationView";
import { UpdateQuotationUseCase } from "@application/useCases/quotations/UpdateQuotationUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  QuotationParams,
  UpdateQuotationBody,
  quotationParamsSchema,
  updateQuotationSchema,
} from "./schemas/quotationSchemas";

@Injectable()
@Schema(updateQuotationSchema)
export class UpdateQuotationController extends Controller<
  "private",
  UpdateQuotationController.Response
> {
  constructor(private readonly useCase: UpdateQuotationUseCase) {
    super();
  }

  protected override async handle({
    body,
    params,
    userId,
  }: Controller.Request<"private", UpdateQuotationBody, QuotationParams>) {
    const { entityId, quotationId } = quotationParamsSchema.parse(params);
    const quotation = await this.useCase.execute({
      ...body,
      entityId,
      quotationId,
      userId,
    });

    return { statusCode: 200, body: { quotation } };
  }
}

export namespace UpdateQuotationController {
  export type Response = { quotation: QuotationView };
}
