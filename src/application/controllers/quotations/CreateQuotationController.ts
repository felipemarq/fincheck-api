import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { QuotationView } from "@application/queries/types/QuotationView";
import { CreateQuotationUseCase } from "@application/useCases/quotations/CreateQuotationUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreateQuotationBody,
  createQuotationSchema,
} from "./schemas/quotationSchemas";

@Injectable()
@Schema(createQuotationSchema)
export class CreateQuotationController extends Controller<
  "private",
  CreateQuotationController.Response
> {
  constructor(private readonly useCase: CreateQuotationUseCase) {
    super();
  }

  protected override async handle({
    body,
    params,
    userId,
  }: Controller.Request<"private", CreateQuotationBody, OrganizationParams>) {
    const { entityId } = organizationParamsSchema.parse(params);
    const quotation = await this.useCase.execute({ ...body, entityId, userId });

    return { statusCode: 201, body: { quotation } };
  }
}

export namespace CreateQuotationController {
  export type Response = { quotation: QuotationView };
}
