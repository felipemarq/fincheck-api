import { Controller } from "@application/contracts/Controller";
import { DeleteQuotationImageUseCase } from "@application/useCases/quotations/DeleteQuotationImageUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  QuotationImageParams,
  quotationImageParamsSchema,
} from "./schemas/quotationSchemas";

@Injectable()
export class DeleteQuotationImageController extends Controller<"private"> {
  constructor(private readonly useCase: DeleteQuotationImageUseCase) {
    super();
  }

  protected override async handle({
    params,
    userId,
  }: Controller.Request<"private", Record<string, never>, QuotationImageParams>) {
    const parsed = quotationImageParamsSchema.parse(params);
    await this.useCase.execute({ ...parsed, userId });
    return { statusCode: 204 };
  }
}
