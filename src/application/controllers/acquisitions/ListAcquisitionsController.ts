import { Controller } from "@application/contracts/Controller";
import {
  PurchaseOrderParams,
  purchaseOrderParamsSchema,
} from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import { AcquisitionView } from "@application/queries/types/AcquisitionView";
import { ListAcquisitionsUseCase } from "@application/useCases/acquisitions/ListAcquisitionsUseCase";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListAcquisitionsController extends Controller<
  "private",
  ListAcquisitionsController.Response
> {
  constructor(
    private readonly listAcquisitionsUseCase: ListAcquisitionsUseCase
  ) {
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
    const { entityId, purchaseOrderId } =
      purchaseOrderParamsSchema.parse(params);
    const { acquisitions } =
      await this.listAcquisitionsUseCase.execute({
        entityId,
        purchaseOrderId,
        userId,
      });

    return {
      statusCode: 200,
      body: { acquisitions },
    };
  }
}

export namespace ListAcquisitionsController {
  export type Response = {
    acquisitions: AcquisitionView[];
  };
}
