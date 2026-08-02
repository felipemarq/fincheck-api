import { Controller } from "@application/contracts/Controller";
import { ReceivablePaymentView } from "@application/queries/types/InvoiceView";
import { UpdateReceivablePaymentUseCase } from "@application/useCases/invoices/UpdateReceivablePaymentUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  ReceivablePaymentParams,
  UpdateReceivablePaymentBody,
  receivablePaymentParamsSchema,
  updateReceivablePaymentSchema,
} from "./schemas/invoiceSchemas";

@Injectable()
@Schema(updateReceivablePaymentSchema)
export class UpdateReceivablePaymentController extends Controller<
  "private",
  UpdateReceivablePaymentController.Response
> {
  constructor(
    private readonly useCase: UpdateReceivablePaymentUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    UpdateReceivablePaymentBody,
    ReceivablePaymentParams
  >) {
    const route = receivablePaymentParamsSchema.parse(params);
    const payment = await this.useCase.execute({
      ...body,
      ...route,
      userId,
    });

    return { statusCode: 200, body: { payment } };
  }
}

export namespace UpdateReceivablePaymentController {
  export type Response = { payment: ReceivablePaymentView };
}
