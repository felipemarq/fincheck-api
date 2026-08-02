import { Controller } from "@application/contracts/Controller";
import { AcquisitionView } from "@application/queries/types/AcquisitionView";
import { UpdateAcquisitionUseCase } from "@application/useCases/acquisitions/UpdateAcquisitionUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  AcquisitionParams,
  UpdateAcquisitionBody,
  acquisitionParamsSchema,
  updateAcquisitionSchema,
} from "./schemas/acquisitionSchemas";

@Injectable()
@Schema(updateAcquisitionSchema)
export class UpdateAcquisitionController extends Controller<
  "private",
  UpdateAcquisitionController.Response
> {
  constructor(
    private readonly updateAcquisitionUseCase: UpdateAcquisitionUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    UpdateAcquisitionBody,
    AcquisitionParams
  >) {
    const { entityId, purchaseOrderId, acquisitionId } =
      acquisitionParamsSchema.parse(params);
    const acquisition = await this.updateAcquisitionUseCase.execute({
      ...body,
      entityId,
      purchaseOrderId,
      acquisitionId,
      userId,
    });

    return {
      statusCode: 200,
      body: { acquisition },
    };
  }
}

export namespace UpdateAcquisitionController {
  export type Response = {
    acquisition: AcquisitionView;
  };
}
