import { Controller } from "@application/contracts/Controller";
import { InvoiceView } from "@application/queries/types/InvoiceView";
import { UpdateInvoiceUseCase } from "@application/useCases/invoices/UpdateInvoiceUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  InvoiceParams,
  UpdateInvoiceBody,
  invoiceParamsSchema,
  updateInvoiceSchema,
} from "./schemas/invoiceSchemas";

@Injectable()
@Schema(updateInvoiceSchema)
export class UpdateInvoiceController extends Controller<
  "private",
  UpdateInvoiceController.Response
> {
  constructor(private readonly useCase: UpdateInvoiceUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", UpdateInvoiceBody, InvoiceParams>) {
    const route = invoiceParamsSchema.parse(params);
    const invoice = await this.useCase.execute({
      ...body,
      ...route,
      userId,
    });

    return { statusCode: 200, body: { invoice } };
  }
}

export namespace UpdateInvoiceController {
  export type Response = { invoice: InvoiceView };
}
