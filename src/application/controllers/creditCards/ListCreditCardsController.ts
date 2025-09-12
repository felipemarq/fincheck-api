import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ListCreditCardsQuery,
  listCreditCardsQuerySchema,
} from "./schemas/listCreditCardsQuerySchema";
import { CreditCard } from "@application/entities/CreditCard";
import { ListCreditCardsUseCase } from "@application/useCases/creditCards/ListCreditCardsUseCase";

@Injectable()
export class ListCreditCardsController extends Controller<
  "private",
  ListCreditCardsController.Response
> {
  constructor(private readonly listCreditCardsUseCase: ListCreditCardsUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
    queryParams,
  }: Controller.Request<
    "private",
    Record<string, any>,
    Record<string, any>,
    ListCreditCardsQuery
  >): Promise<Controller.Response<ListCreditCardsController.Response>> {
    const listTransactionFilters = listCreditCardsQuerySchema.parse(
      queryParams ?? {}
    );

    const { creditCards } = await this.listCreditCardsUseCase.execute({
      ...listTransactionFilters,
      userId,
    });

    return {
      statusCode: 200,
      body: { creditCards },
    };
  }
}

export namespace ListCreditCardsController {
  export type Response = {
    creditCards: CreditCard[];
  };
}
