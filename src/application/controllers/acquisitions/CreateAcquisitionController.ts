import { Controller } from "@application/contracts/Controller";
import {
  PurchaseOrderParams,
  purchaseOrderParamsSchema,
} from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import { AcquisitionView } from "@application/queries/types/AcquisitionView";
import { CreateAcquisitionUseCase } from "@application/useCases/acquisitions/CreateAcquisitionUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreateAcquisitionBody,
  createAcquisitionSchema,
} from "./schemas/acquisitionSchemas";

@Injectable()
@Schema(createAcquisitionSchema)
export class CreateAcquisitionController extends Controller<
  "private",
  CreateAcquisitionController.Response
> {
  constructor(
    private readonly createAcquisitionUseCase: CreateAcquisitionUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    CreateAcquisitionBody,
    PurchaseOrderParams
  >) {
    const { entityId, purchaseOrderId } =
      purchaseOrderParamsSchema.parse(params);
    const acquisition = await this.createAcquisitionUseCase.execute({
      ...body,
      entityId,
      purchaseOrderId,
      userId,
    });

    return {
      statusCode: 201,
      body: { acquisition },
    };
  }
}

export namespace CreateAcquisitionController {
  export type Response = {
    acquisition: AcquisitionView;
  };
}
