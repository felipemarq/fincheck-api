import { Controller } from "@application/contracts/Controller";
import { DeleteDailyCalorieUseCase } from "@application/useCases/personalHealth/DeleteDailyCalorieUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  DailyCalorieParams,
  dailyCalorieParamsSchema,
} from "./schemas/personalHealthSchemas";

@Injectable()
export class DeleteDailyCalorieController extends Controller<"private"> {
  constructor(private readonly useCase: DeleteDailyCalorieUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<
    "private",
    Record<string, never>,
    DailyCalorieParams
  >) {
    const { loggedOn } = dailyCalorieParamsSchema.parse(params);
    await this.useCase.execute({ userId, loggedOn });

    return { statusCode: 204 };
  }
}
