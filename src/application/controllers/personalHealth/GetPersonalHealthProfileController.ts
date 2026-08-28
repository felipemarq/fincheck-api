import { Controller } from "@application/contracts/Controller";
import { PersonalEnergyService } from "@application/services/PersonalEnergyService";
import { GetPersonalHealthProfileUseCase } from "@application/useCases/personalHealth/GetPersonalHealthProfileUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  PersonalHealthProfileResponse,
  toPersonalHealthProfileResponse,
} from "./personalHealthResponse";
import {
  HealthProfileQuery,
  healthProfileQuerySchema,
} from "./schemas/personalHealthSchemas";

@Injectable()
export class GetPersonalHealthProfileController extends Controller<
  "private",
  GetPersonalHealthProfileController.Response
> {
  constructor(private readonly useCase: GetPersonalHealthProfileUseCase) {
    super();
  }

  protected override async handle({
    userId,
    queryParams,
  }: Controller.Request<
    "private",
    Record<string, never>,
    Record<string, never>,
    HealthProfileQuery
  >) {
    const query = healthProfileQuerySchema.parse(queryParams);
    const result = await this.useCase.execute({
      userId,
      onDate: query.onDate ?? new Date().toISOString().slice(0, 10),
    });

    return {
      statusCode: 200,
      body: {
        profile: result.profile
          ? toPersonalHealthProfileResponse(result.profile)
          : null,
        calculation: result.calculation,
      },
    };
  }
}

export namespace GetPersonalHealthProfileController {
  export type Response = {
    profile: PersonalHealthProfileResponse | null;
    calculation: PersonalEnergyService.Result;
  };
}
