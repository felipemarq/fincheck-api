import { Controller } from "@application/contracts/Controller";
import { ListBodyWeightsUseCase } from "@application/useCases/bodyWeights/ListBodyWeightsUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ListBodyWeightsQuery,
  listBodyWeightsQuerySchema,
} from "./schemas/bodyWeightSchemas";
import {
  BodyWeightResponse,
  toBodyWeightResponse,
} from "./bodyWeightResponse";

@Injectable()
export class ListBodyWeightsController extends Controller<
  "private",
  ListBodyWeightsController.Response
> {
  constructor(private readonly useCase: ListBodyWeightsUseCase) {
    super();
  }

  protected override async handle({
    userId,
    queryParams,
  }: Controller.Request<
    "private",
    Record<string, never>,
    Record<string, never>,
    ListBodyWeightsQuery
  >) {
    const query = listBodyWeightsQuerySchema.parse(queryParams);
    const entries = await this.useCase.execute({ userId, ...query });

    return {
      statusCode: 200,
      body: { entries: entries.map(toBodyWeightResponse) },
    };
  }
}

export namespace ListBodyWeightsController {
  export type Response = { entries: BodyWeightResponse[] };
}
