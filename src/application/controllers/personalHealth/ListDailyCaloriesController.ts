import { Controller } from "@application/contracts/Controller";
import { ListDailyCaloriesUseCase } from "@application/useCases/personalHealth/ListDailyCaloriesUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  DailyCalorieResponse,
  toDailyCalorieResponse,
} from "./personalHealthResponse";
import {
  ListDailyCaloriesQuery,
  listDailyCaloriesQuerySchema,
} from "./schemas/personalHealthSchemas";

@Injectable()
export class ListDailyCaloriesController extends Controller<
  "private",
  ListDailyCaloriesController.Response
> {
  constructor(private readonly useCase: ListDailyCaloriesUseCase) {
    super();
  }

  protected override async handle({
    userId,
    queryParams,
  }: Controller.Request<
    "private",
    Record<string, never>,
    Record<string, never>,
    ListDailyCaloriesQuery
  >) {
    const query = listDailyCaloriesQuerySchema.parse(queryParams);
    const result = await this.useCase.execute({ userId, ...query });

    return {
      statusCode: 200,
      body: {
        entries: result.entries.map(toDailyCalorieResponse),
        summary: result.summary,
      },
    };
  }
}

export namespace ListDailyCaloriesController {
  export type Response = {
    entries: DailyCalorieResponse[];
    summary: ListDailyCaloriesUseCase.Output["summary"];
  };
}
