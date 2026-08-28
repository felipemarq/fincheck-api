import { Controller } from "@application/contracts/Controller";
import { UpsertDailyCalorieUseCase } from "@application/useCases/personalHealth/UpsertDailyCalorieUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { toRawDailyCalorieResponse } from "./personalHealthResponse";
import {
  DailyCalorieParams,
  UpsertDailyCalorieBody,
  dailyCalorieParamsSchema,
  upsertDailyCalorieSchema,
} from "./schemas/personalHealthSchemas";

@Injectable()
@Schema(upsertDailyCalorieSchema)
export class UpsertDailyCalorieController extends Controller<
  "private",
  UpsertDailyCalorieController.Response
> {
  constructor(private readonly useCase: UpsertDailyCalorieUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
    body,
  }: Controller.Request<
    "private",
    UpsertDailyCalorieBody,
    DailyCalorieParams
  >) {
    const { loggedOn } = dailyCalorieParamsSchema.parse(params);
    const entry = await this.useCase.execute({ userId, loggedOn, ...body });

    return {
      statusCode: 200,
      body: { entry: toRawDailyCalorieResponse(entry) },
    };
  }
}

export namespace UpsertDailyCalorieController {
  export type Response = {
    entry: ReturnType<typeof toRawDailyCalorieResponse>;
  };
}
