import { Controller } from "@application/contracts/Controller";
import { AcquisitionReceiptView } from "@application/queries/types/AcquisitionReceiptView";
import { UpdateAcquisitionReceiptUseCase } from "@application/useCases/receipts/UpdateAcquisitionReceiptUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  ReceiptParams,
  UpdateReceiptBody,
  receiptParamsSchema,
  updateReceiptSchema,
} from "./schemas/receiptSchemas";

@Injectable()
@Schema(updateReceiptSchema)
export class UpdateAcquisitionReceiptController extends Controller<
  "private",
  UpdateAcquisitionReceiptController.Response
> {
  constructor(
    private readonly useCase: UpdateAcquisitionReceiptUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", UpdateReceiptBody, ReceiptParams>) {
    const route = receiptParamsSchema.parse(params);
    const receipt = await this.useCase.execute({
      ...body,
      ...route,
      userId,
    });

    return { statusCode: 200, body: { receipt } };
  }
}

export namespace UpdateAcquisitionReceiptController {
  export type Response = { receipt: AcquisitionReceiptView };
}
