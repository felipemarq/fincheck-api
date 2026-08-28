import { Controller } from "@application/contracts/Controller";
import { DeleteBodyWeightUseCase } from "@application/useCases/bodyWeights/DeleteBodyWeightUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  BodyWeightParams,
  bodyWeightParamsSchema,
} from "./schemas/bodyWeightSchemas";

@Injectable()
export class DeleteBodyWeightController extends Controller<"private"> {
  constructor(private readonly useCase: DeleteBodyWeightUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<
    "private",
    Record<string, never>,
    BodyWeightParams
  >) {
    const { measuredOn } = bodyWeightParamsSchema.parse(params);
    await this.useCase.execute({ userId, measuredOn });

    return { statusCode: 204 };
  }
}
