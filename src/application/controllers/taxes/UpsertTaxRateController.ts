// src/application/controllers/taxes/UpsertTaxRateController.ts
import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";

import {
  UpsertTaxRateBody,
  upsertTaxRateBodySchema,
  UpsertTaxRateParams,
  upsertTaxRateParamsSchema,
} from "./schema/upsertTaxRateSchema";
import { UpsertTaxRateUseCase } from "@application/useCases/taxes/UpsertTaxRateUseCase";
import { TaxRate } from "@application/entities/TaxRate";

@Injectable()
export class UpsertTaxRateController extends Controller<
  "private",
  UpsertTaxRateController.Response
> {
  constructor(private readonly upsertTaxRateUseCase: UpsertTaxRateUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
    body,
  }: Controller.Request<"private", UpsertTaxRateBody, UpsertTaxRateParams>) {
    const upsertParams = upsertTaxRateParamsSchema.parse(params);
    const upsertBody = upsertTaxRateBodySchema.parse(body);

    const taxRate = await this.upsertTaxRateUseCase.execute({
      entityId: upsertParams.entityId,
      userId,
      year: upsertParams.year,
      month: upsertParams.month,
      ratePercent: upsertBody.ratePercent,
    });

    return { statusCode: 200, body: { taxRate } };
  }
}

export namespace UpsertTaxRateController {
  export type Response = {
    taxRate: TaxRate;
  };
}
