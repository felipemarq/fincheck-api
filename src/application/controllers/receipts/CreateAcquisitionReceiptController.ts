import { Controller } from "@application/contracts/Controller";
import {
  AcquisitionParams,
  acquisitionParamsSchema,
} from "@application/controllers/acquisitions/schemas/acquisitionSchemas";
import { AcquisitionReceiptView } from "@application/queries/types/AcquisitionReceiptView";
import { CreateAcquisitionReceiptUseCase } from "@application/useCases/receipts/CreateAcquisitionReceiptUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  CreateReceiptBody,
  createReceiptSchema,
} from "./schemas/receiptSchemas";

@Injectable()
@Schema(createReceiptSchema)
export class CreateAcquisitionReceiptController extends Controller<
  "private",
  CreateAcquisitionReceiptController.Response
> {
  constructor(
    private readonly useCase: CreateAcquisitionReceiptUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", CreateReceiptBody, AcquisitionParams>) {
    const route = acquisitionParamsSchema.parse(params);
    const receipt = await this.useCase.execute({
      ...body,
      ...route,
      userId,
    });

    return { statusCode: 201, body: { receipt } };
  }
}

export namespace CreateAcquisitionReceiptController {
  export type Response = { receipt: AcquisitionReceiptView };
}
