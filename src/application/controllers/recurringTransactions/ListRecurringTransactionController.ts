import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";

import { ListTransactionUseCase } from "@application/useCases/transactions/ListTransactionUseCase";
import { Transaction } from "@application/entities/Transaction";
import {
  ListRecurringTransactionQuery,
  listRecurringTransactionQuerySchema,
} from "./schemas/listRecurringTransactionQuerySchema";
import { ListRecurringTransactionUseCase } from "@application/useCases/recurringTransactions/ListRecurringTransactionUseCase";
import { RecurringTransaction } from "@application/entities/RecurringTransaction";

@Injectable()
export class ListRecurringTransactionController extends Controller<
  "private",
  ListRecurringTransactionController.Response
> {
  constructor(
    private readonly listRecurringTransactionUseCase: ListRecurringTransactionUseCase
  ) {
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
    ListRecurringTransactionQuery
  >): Promise<
    Controller.Response<ListRecurringTransactionController.Response>
  > {
    const listTransactionFilters = listRecurringTransactionQuerySchema.parse(
      queryParams ?? {}
    );

    const { hasNext, items, total, page, pageSize } =
      await this.listRecurringTransactionUseCase.execute({
        ...listTransactionFilters,
        userId,
      });

    return {
      statusCode: 200,
      body: { hasNext, items, total, page, pageSize },
    };
  }
}

export namespace ListRecurringTransactionController {
  export type Response = {
    items: RecurringTransaction[];
    total: number;
    page: string | undefined;
    pageSize: number;
    hasNext: boolean;
  };
}
