import { Controller } from "@application/contracts/Controller";
import {
  AcquisitionParams,
  acquisitionParamsSchema,
} from "@application/controllers/acquisitions/schemas/acquisitionSchemas";
import { AcquisitionReceiptView } from "@application/queries/types/AcquisitionReceiptView";
import { ListAcquisitionReceiptsUseCase } from "@application/useCases/receipts/ListAcquisitionReceiptsUseCase";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListAcquisitionReceiptsController extends Controller<
  "private",
  ListAcquisitionReceiptsController.Response
> {
  constructor(
    private readonly useCase: ListAcquisitionReceiptsUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<
    "private",
    Record<string, never>,
    AcquisitionParams
  >) {
    const route = acquisitionParamsSchema.parse(params);
    const receipts = await this.useCase.execute({ ...route, userId });

    return { statusCode: 200, body: { receipts } };
  }
}

export namespace ListAcquisitionReceiptsController {
  export type Response = { receipts: AcquisitionReceiptView[] };
}
