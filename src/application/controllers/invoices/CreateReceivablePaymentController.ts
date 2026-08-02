import { Controller } from "@application/contracts/Controller";
import { ReceivablePaymentView } from "@application/queries/types/InvoiceView";
import { CreateReceivablePaymentUseCase } from "@application/useCases/invoices/CreateReceivablePaymentUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreateReceivablePaymentBody,
  InvoiceParams,
  createReceivablePaymentSchema,
  invoiceParamsSchema,
} from "./schemas/invoiceSchemas";

@Injectable()
@Schema(createReceivablePaymentSchema)
export class CreateReceivablePaymentController extends Controller<
  "private",
  CreateReceivablePaymentController.Response
> {
  constructor(
    private readonly useCase: CreateReceivablePaymentUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    CreateReceivablePaymentBody,
    InvoiceParams
  >) {
    const route = invoiceParamsSchema.parse(params);
    const payment = await this.useCase.execute({
      ...body,
      ...route,
      userId,
    });

    return { statusCode: 201, body: { payment } };
  }
}

export namespace CreateReceivablePaymentController {
  export type Response = { payment: ReceivablePaymentView };
}
