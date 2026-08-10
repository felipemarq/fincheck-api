import { Controller } from "@application/contracts/Controller";
import { AcquisitionView } from "@application/queries/types/AcquisitionView";
import { UpdateAcquisitionUseCase } from "@application/useCases/acquisitions/UpdateAcquisitionUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  SupplierPurchaseParams,
  UpdateAcquisitionBody,
  supplierPurchaseParamsSchema,
  updateAcquisitionSchema,
} from "./schemas/acquisitionSchemas";

@Injectable()
@Schema(updateAcquisitionSchema)
export class UpdateSupplierPurchaseController extends Controller<
  "private",
  UpdateSupplierPurchaseController.Response
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
    SupplierPurchaseParams
  >) {
    const { entityId, acquisitionId } =
      supplierPurchaseParamsSchema.parse(params);
    const acquisition = await this.updateAcquisitionUseCase.execute({
      ...body,
      entityId,
      acquisitionId,
      userId,
    });

    return { statusCode: 200, body: { acquisition } };
  }
}

export namespace UpdateSupplierPurchaseController {
  export type Response = { acquisition: AcquisitionView };
}
