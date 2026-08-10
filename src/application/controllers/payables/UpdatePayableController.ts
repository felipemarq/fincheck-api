import { Controller } from "@application/contracts/Controller";
import { Payable } from "@application/entities/Payable";
import { UpdatePayableUseCase } from "@application/useCases/payables/UpdatePayableUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { PayableParams, payableParamsSchema, UpdatePayableBody, updatePayableSchema } from "./schemas/payableSchemas";

@Injectable()
@Schema(updatePayableSchema)
export class UpdatePayableController extends Controller<"private", UpdatePayableController.Response> {
  constructor(private readonly useCase: UpdatePayableUseCase) { super(); }
  protected override async handle({ userId, body, params }: Controller.Request<"private", UpdatePayableBody, PayableParams>) {
    const route = payableParamsSchema.parse(params);
    const payable = await this.useCase.execute({ ...body, ...route, userId });
    return { statusCode: 200, body: { payable } };
  }
}

export namespace UpdatePayableController {
  export type Response = { payable: Payable };
}
