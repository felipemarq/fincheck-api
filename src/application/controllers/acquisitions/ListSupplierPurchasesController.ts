import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { AcquisitionView } from "@application/queries/types/AcquisitionView";
import { ListAcquisitionsUseCase } from "@application/useCases/acquisitions/ListAcquisitionsUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ListSupplierPurchasesQuery,
  listSupplierPurchasesQuerySchema,
} from "./schemas/acquisitionSchemas";

@Injectable()
export class ListSupplierPurchasesController extends Controller<
  "private",
  ListSupplierPurchasesController.Response
> {
  constructor(
    private readonly listAcquisitionsUseCase: ListAcquisitionsUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    params,
    queryParams,
  }: Controller.Request<
    "private",
    Record<string, never>,
    OrganizationParams,
    ListSupplierPurchasesQuery
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listSupplierPurchasesQuerySchema.parse(queryParams);
    const { acquisitions } = await this.listAcquisitionsUseCase.execute({
      ...query,
      entityId,
      userId,
    });

    return { statusCode: 200, body: { acquisitions } };
  }
}

export namespace ListSupplierPurchasesController {
  export type Response = { acquisitions: AcquisitionView[] };
}
