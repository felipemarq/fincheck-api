import { Controller } from "@application/contracts/Controller";
import { QuotationImageView } from "@application/queries/types/QuotationView";
import { UploadQuotationImageUseCase } from "@application/useCases/quotations/UploadQuotationImageUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  QuotationItemParams,
  UploadQuotationImageBody,
  quotationItemParamsSchema,
  uploadQuotationImageSchema,
} from "./schemas/quotationSchemas";

@Injectable()
@Schema(uploadQuotationImageSchema)
export class UploadQuotationImageController extends Controller<
  "private",
  UploadQuotationImageController.Response
> {
  constructor(private readonly useCase: UploadQuotationImageUseCase) {
    super();
  }

  protected override async handle({
    body,
    params,
    userId,
  }: Controller.Request<
    "private",
    UploadQuotationImageBody,
    QuotationItemParams
  >) {
    const parsed = quotationItemParamsSchema.parse(params);
    const image = await this.useCase.execute({ ...parsed, ...body, userId });
    return { statusCode: 201, body: { image } };
  }
}

export namespace UploadQuotationImageController {
  export type Response = { image: QuotationImageView };
}
