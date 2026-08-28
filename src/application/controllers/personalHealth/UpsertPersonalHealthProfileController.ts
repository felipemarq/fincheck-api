import { Controller } from "@application/contracts/Controller";
import { PersonalEnergyService } from "@application/services/PersonalEnergyService";
import { UpsertPersonalHealthProfileUseCase } from "@application/useCases/personalHealth/UpsertPersonalHealthProfileUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
  PersonalHealthProfileResponse,
  toPersonalHealthProfileResponse,
} from "./personalHealthResponse";
import {
  HealthProfileQuery,
  UpsertPersonalHealthProfileBody,
  healthProfileQuerySchema,
  upsertPersonalHealthProfileSchema,
} from "./schemas/personalHealthSchemas";

@Injectable()
@Schema(upsertPersonalHealthProfileSchema)
export class UpsertPersonalHealthProfileController extends Controller<
  "private",
  UpsertPersonalHealthProfileController.Response
> {
  constructor(private readonly useCase: UpsertPersonalHealthProfileUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    queryParams,
  }: Controller.Request<
    "private",
    UpsertPersonalHealthProfileBody,
    Record<string, never>,
    HealthProfileQuery
  >) {
    const query = healthProfileQuerySchema.parse(queryParams);
    const result = await this.useCase.execute({
      userId,
      onDate: query.onDate ?? new Date().toISOString().slice(0, 10),
      ...body,
    });

    return {
      statusCode: 200,
      body: {
        profile: toPersonalHealthProfileResponse(result.profile),
        calculation: result.calculation,
      },
    };
  }
}

export namespace UpsertPersonalHealthProfileController {
  export type Response = {
    profile: PersonalHealthProfileResponse;
    calculation: PersonalEnergyService.Result;
  };
}
