import { Controller } from "@application/contracts/Controller";
import { UpsertBodyWeightUseCase } from "@application/useCases/bodyWeights/UpsertBodyWeightUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  BodyWeightParams,
  UpsertBodyWeightBody,
  bodyWeightParamsSchema,
  upsertBodyWeightSchema,
} from "./schemas/bodyWeightSchemas";
import {
  BodyWeightResponse,
  toBodyWeightResponse,
} from "./bodyWeightResponse";

@Injectable()
@Schema(upsertBodyWeightSchema)
export class UpsertBodyWeightController extends Controller<
  "private",
  UpsertBodyWeightController.Response
> {
  constructor(private readonly useCase: UpsertBodyWeightUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    UpsertBodyWeightBody,
    BodyWeightParams
  >) {
    const { measuredOn } = bodyWeightParamsSchema.parse(params);
    const entry = await this.useCase.execute({ userId, measuredOn, ...body });

    return {
      statusCode: 200,
      body: { entry: toBodyWeightResponse(entry) },
    };
  }
}

export namespace UpsertBodyWeightController {
  export type Response = { entry: BodyWeightResponse };
}
