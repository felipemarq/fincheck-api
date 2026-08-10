import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
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
export class CreateSupplierPurchaseController extends Controller<
  "private",
  CreateSupplierPurchaseController.Response
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
  }: Controller.Request<"private", CreateAcquisitionBody, OrganizationParams>) {
    const { entityId } = organizationParamsSchema.parse(params);
    const acquisition = await this.createAcquisitionUseCase.execute({
      ...body,
      entityId,
      userId,
    });

    return { statusCode: 201, body: { acquisition } };
  }
}

export namespace CreateSupplierPurchaseController {
  export type Response = { acquisition: AcquisitionView };
}
