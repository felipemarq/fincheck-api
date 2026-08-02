import { Controller } from "@application/contracts/Controller";
import {
  PurchaseOrderParams,
  purchaseOrderParamsSchema,
} from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import { InvoiceView } from "@application/queries/types/InvoiceView";
import { ListInvoicesUseCase } from "@application/useCases/invoices/ListInvoicesUseCase";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListInvoicesController extends Controller<
  "private",
  ListInvoicesController.Response
> {
  constructor(private readonly useCase: ListInvoicesUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<
    "private",
    Record<string, never>,
    PurchaseOrderParams
  >) {
    const route = purchaseOrderParamsSchema.parse(params);
    const invoices = await this.useCase.execute({ ...route, userId });

    return { statusCode: 200, body: { invoices } };
  }
}

export namespace ListInvoicesController {
  export type Response = { invoices: InvoiceView[] };
}
