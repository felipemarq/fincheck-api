import { Controller } from "@application/contracts/Controller";
import {
  PurchaseOrderParams,
  purchaseOrderParamsSchema,
} from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import { InvoiceView } from "@application/queries/types/InvoiceView";
import { CreateInvoiceUseCase } from "@application/useCases/invoices/CreateInvoiceUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreateInvoiceBody,
  createInvoiceSchema,
} from "./schemas/invoiceSchemas";

@Injectable()
@Schema(createInvoiceSchema)
export class CreateInvoiceController extends Controller<
  "private",
  CreateInvoiceController.Response
> {
  constructor(private readonly useCase: CreateInvoiceUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    CreateInvoiceBody,
    PurchaseOrderParams
  >) {
    const route = purchaseOrderParamsSchema.parse(params);
    const invoice = await this.useCase.execute({
      ...body,
      ...route,
      userId,
    });

    return { statusCode: 201, body: { invoice } };
  }
}

export namespace CreateInvoiceController {
  export type Response = { invoice: InvoiceView };
}
