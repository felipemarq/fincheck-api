import { Controller } from "@application/contracts/Controller";
import { organizationParamsSchema, OrganizationParams } from "@application/controllers/v2Schemas";
import { CreditCard } from "@application/entities/CreditCard";
import { ListCreditCardsUseCase } from "@application/useCases/creditCards/ListCreditCardsUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { ListCreditCardsQuery, listCreditCardsQuerySchema } from "./schemas/creditCardSchemas";

@Injectable()
export class ListCreditCardsController extends Controller<"private", ListCreditCardsController.Response> {
  constructor(private readonly useCase: ListCreditCardsUseCase) { super(); }

  protected override async handle({ userId, params, queryParams }: Controller.Request<"private", Record<string, never>, OrganizationParams, ListCreditCardsQuery>) {
    const { entityId } = organizationParamsSchema.parse(params);
    const query = listCreditCardsQuerySchema.parse(queryParams);
    const creditCards = await this.useCase.execute({ ...query, entityId, userId });
    return { statusCode: 200, body: { creditCards } };
  }
}

export namespace ListCreditCardsController {
  export type Response = { creditCards: CreditCard[] };
}
