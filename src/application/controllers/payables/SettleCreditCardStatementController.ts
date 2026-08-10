import { Controller } from "@application/contracts/Controller";
import {
  OrganizationParams,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { SettleCreditCardStatementUseCase } from "@application/useCases/payables/SettleCreditCardStatementUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  SettleCreditCardStatementBody,
  settleCreditCardStatementSchema,
} from "./schemas/payableSchemas";

@Injectable()
@Schema(settleCreditCardStatementSchema)
export class SettleCreditCardStatementController extends Controller<
  "private",
  SettleCreditCardStatementController.Response
> {
  constructor(private readonly useCase: SettleCreditCardStatementUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    SettleCreditCardStatementBody,
    OrganizationParams
  >) {
    const { entityId } = organizationParamsSchema.parse(params);
    const settlement = await this.useCase.execute({
      ...body,
      entityId,
      userId,
    });

    return { statusCode: 200, body: { settlement } };
  }
}

export namespace SettleCreditCardStatementController {
  export type Response = {
    settlement: SettleCreditCardStatementUseCase.Result;
  };
}
