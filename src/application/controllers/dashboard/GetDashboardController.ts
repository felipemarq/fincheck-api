import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  getDashboardQuerySchema,
  GetDashboardQuery,
} from "./schemas/getDashboardQuerySchema";
import { GetDashboardUseCase } from "@application/useCases/dashboard/GetDashboardUseCase";

@Injectable()
export class GetDashboardController extends Controller<
  "private",
  GetDashboardController.Response
> {
  constructor(private readonly useCase: GetDashboardUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
    queryParams,
  }: Controller.Request<
    "private",
    Record<string, unknown>,
    Record<string, unknown>,
    GetDashboardQuery
  >): Promise<Controller.Response<GetDashboardController.Response>> {
    console.log(queryParams);
    const q = getDashboardQuerySchema.parse(queryParams);

    const res = await this.useCase.execute({
      ...q,
      userId,
    });

    return { statusCode: 200, body: res };
  }
}

export namespace GetDashboardController {
  export type Response = {
    body: any;
  };
}
